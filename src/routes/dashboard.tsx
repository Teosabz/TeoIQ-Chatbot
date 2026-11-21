import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { UploadCard } from "@/components/UploadCard";
import { AnalysisCard } from "@/components/AnalysisCard";
import { HistoryPanel } from "@/components/HistoryPanel";
import { compressImage, makeThumbnail, toDataUrl } from "@/lib/compress";
import {
  clearHistory,
  deleteHistoryItem,
  readHistory,
  saveToHistory,
  type Analysis,
  type HistoryItem,
} from "@/lib/analysis";
import { addJournalEntry } from "@/lib/journal";
import type { TradingMode } from "@/lib/engine/modes";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TeoIQ AI Chart Analysis" },
      {
        name: "description",
        content:
          "Your TeoIQ dashboard: upload MT4 or MT5 chart screenshots and get an AI trade plan with bias, entry, stop loss, take profit and risk:reward.",
      },
      { property: "og:title", content: "Dashboard — TeoIQ AI Chart Analysis" },
      {
        property: "og:description",
        content: "Upload a MetaTrader chart and get an instant institutional AI trade plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);



  const handleAnalyze = async (file: File, mode: TradingMode = "day") => {
    setLoading(true);
    setAnalysis(null);
    try {
      const [optimized, thumbnail, dataUrl] = await Promise.all([
        compressImage(file),
        makeThumbnail(file),
        toDataUrl(file),
      ]);
      setImageSrc(dataUrl);

      const formData = new FormData();
      formData.append("chart", optimized);
      formData.append("mode", mode);


      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });


      const payload = (await response.json()) as Analysis & { error?: string };

      if (!response.ok || payload.error) {
        toast.error(payload.error || "Analysis failed. Please try again.");
        return;
      }

      setAnalysis(payload);
      setHistory(saveToHistory(payload, thumbnail));
      addJournalEntry(payload, thumbnail);
      toast.success("Chart analysed successfully");
    } catch {
      toast.error("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
      <AppHeader />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
        <UploadCard onAnalyze={handleAnalyze} loading={loading} />
        <AnalysisCard
          analysis={analysis}
          loading={loading}
          imageSrc={imageSrc}
          onClear={() => {
            setAnalysis(null);
            setImageSrc(null);
          }}
        />
      </div>

      <HistoryPanel
        items={history}
        onSelect={(item) => {
          setAnalysis(item);
          setImageSrc(item.thumbnail ?? null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={(id) => setHistory(deleteHistoryItem(id))}
        onClear={() => setHistory(clearHistory())}
      />

      <footer className="pt-2 pb-6 text-center text-xs text-muted-foreground">
        TeoChart Bot FREE · Powered by Google Gemini 1.5 Flash (free tier) · Educational use only.
      </footer>
    </main>
  );
}
