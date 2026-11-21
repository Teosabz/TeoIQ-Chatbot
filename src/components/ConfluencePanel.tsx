import { Gauge } from "lucide-react";
import type { Analysis } from "@/lib/analysis";

/** Transparent breakdown of the 0–100 confluence score and the engine's reasoning. */
export function ConfluencePanel({ analysis }: { analysis: Analysis }) {
  const score = analysis.confluence_score;
  if (score == null) return null;

  const tone =
    score >= 85 ? "text-success" : score >= 70 ? "text-warning" : "text-muted-foreground";
  const bar = score >= 85 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-muted-foreground";

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <Gauge className="size-3.5" aria-hidden />
            Confluence Score
          </p>
          <p className={`font-display mt-1 text-2xl font-bold ${tone}`}>
            {score}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] tracking-wider text-muted-foreground uppercase">Confidence</p>
          <p className={`text-sm font-semibold ${tone}`}>{analysis.confidence_level}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{analysis.probability_band}</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {!!analysis.factors?.length && (
        <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {analysis.factors.map((f) => (
            <li key={f.key} className="rounded-lg bg-surface-2/50 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={f.passed ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {f.name}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {f.score}/{f.max}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}

      {!!analysis.reasons?.length && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {analysis.reasons.map((r) => (
            <li key={r} className="text-xs leading-relaxed text-muted-foreground">
              • {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
