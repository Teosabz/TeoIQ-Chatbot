import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXTRACTION_PROMPT, normalizeSnapshot, parseModelJson } from "@/lib/engine/extraction";
import { decide } from "@/lib/engine/decision";
import { toAnalysis } from "@/lib/engine/present";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Env is injected per request — always read inside the handler.
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return json(
            { error: "Missing Gemini API key. Add GEMINI_API_KEY to your environment." },
            500,
          );
        }

        let file: File | null = null;
        let mode = "day";
        try {
          const form = await request.formData();
          const value = form.get("chart");
          if (value instanceof File) file = value;
          const m = form.get("mode");
          if (typeof m === "string" && m) mode = m;
        } catch {
          return json({ error: "Invalid upload. Please try again." }, 400);
        }

        if (!file) return json({ error: "No chart image was uploaded." }, 400);
        if (!ALLOWED.includes(file.type)) {
          return json({ error: "Invalid file type. Upload a PNG, JPG or JPEG image." }, 415);
        }
        if (file.size > MAX_BYTES) {
          return json({ error: "File too large. Maximum size is 10MB." }, 413);
        }

        // Image bytes stay in memory only — nothing is persisted server-side.
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        const base64 = btoa(binary);

        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          // Free-tier vision models, tried in order (older keys lose gemini-1.5-flash access).
          const candidates = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
          let text = "";
          let lastError: unknown = null;
          for (const name of candidates) {
            try {
              const model = genAI.getGenerativeModel({ model: name });
              // Stage 1 — extraction only. The decision is made deterministically below.
              const result = await Promise.race([
                model.generateContent([
                  { text: EXTRACTION_PROMPT },
                  { inlineData: { mimeType: file.type, data: base64 } },
                ]),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("timeout")), 55_000),
                ),
              ]);
              text = result.response.text();
              break;
            } catch (err) {
              lastError = err;
              const msg = err instanceof Error ? err.message : "";
              if (!/404|not found|not supported|429|quota/i.test(msg)) throw err;
            }
          }
          if (!text) throw lastError ?? new Error("No Gemini model available");

          try {
            const snapshot = normalizeSnapshot(parseModelJson(text));
            // Stage 2 — confluence scoring, multi-timeframe filter and ATR risk plan.
            const decision = decide(snapshot, { mode: mode as never });
            return json(toAnalysis(snapshot, decision));
          } catch {
            return json({ error: "The AI returned an unreadable response. Try again." }, 502);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          if (/timeout/i.test(message)) {
            return json({ error: "Gemini took too long to respond. Please try again." }, 504);
          }
          if (/quota|rate|429/i.test(message)) {
            return json({ error: "Gemini free-tier rate limit reached. Wait a moment." }, 429);
          }
          if (/API key|401|403|permission/i.test(message)) {
            return json({ error: "Gemini rejected the API key. Check GEMINI_API_KEY." }, 401);
          }
          return json({ error: `Gemini request failed: ${message}` }, 502);
        }
      },
    },
  },
});
