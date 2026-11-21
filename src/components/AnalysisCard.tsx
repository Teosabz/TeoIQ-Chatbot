import { useRef } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Copy,
  Crosshair,
  Download,
  Eraser,
  FileText,
  Layers,
  LineChart,
  Radar,
  Scale,
  Share2,
  Shield,
  Signal,
  Target,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/MetricCard";
import { TradeChecklist } from "@/components/TradeChecklist";
import { ChartAnnotation } from "@/components/ChartAnnotation";
import { ConfidenceBreakdownList, ConfidenceGauge } from "@/components/ConfidenceGauge";
import { ConfluencePanel } from "@/components/ConfluencePanel";
import { ProbabilityMeter } from "@/components/ProbabilityMeter";
import { SessionNewsPanel } from "@/components/SessionNewsPanel";
import { PositionSizeCalculator } from "@/components/PositionSizeCalculator";
import { TradeManagementPanel } from "@/components/TradeManagementPanel";
import { biasTone, buildTradePlan, type Analysis } from "@/lib/analysis";


interface AnalysisCardProps {
  analysis: Analysis | null;
  loading: boolean;
  imageSrc: string | null;
  onClear: () => void;
}

function BiasBanner({ analysis }: { analysis: Analysis }) {
  const tone = biasTone(analysis.bias);
  const label = analysis.decision ?? tone.value;
  const Icon = tone.value === "BUY" ? TrendingUp : tone.value === "SELL" ? TrendingDown : Clock;
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 ${tone.border} ${tone.bg}`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Direction
        </p>
        <p className={`font-display text-3xl leading-tight font-bold ${tone.text}`}>{label}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {analysis.pair} · {analysis.timeframe}
          {analysis.confluence_score != null && ` · ${analysis.confluence_score}/100`}
        </p>
      </div>
      <Icon className={`size-10 shrink-0 ${tone.text}`} aria-hidden />
    </div>
  );
}


export function AnalysisCard({ analysis, loading, imageSrc, onClear }: AnalysisCardProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  const copyPlan = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(buildTradePlan(analysis));
      toast.success("Trade plan copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  };

  const capture = async () => {
    if (!exportRef.current) throw new Error("nothing to export");
    return toPng(exportRef.current, {
      pixelRatio: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
    });
  };

  const downloadPng = async () => {
    try {
      const url = await capture();
      const a = document.createElement("a");
      a.href = url;
      a.download = `teochart-${analysis?.pair || "analysis"}.png`;
      a.click();
      toast.success("PNG downloaded");
    } catch {
      toast.error("Could not export the image");
    }
  };

  const downloadPdf = async () => {
    try {
      const url = await capture();
      const img = new Image();
      img.src = url;
      await new Promise((res) => (img.onload = res));
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const w = pageW - 40;
      const h = (img.height / img.width) * w;
      pdf.addImage(url, "PNG", 20, 20, w, h);
      pdf.save(`teochart-${analysis?.pair || "analysis"}.pdf`);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not export the PDF");
    }
  };

  const share = async () => {
    if (!analysis) return;
    const text = buildTradePlan(analysis);
    if (navigator.share) {
      try {
        await navigator.share({ title: "TeoChart Bot FREE — Trade Plan", text });
        return;
      } catch {
        return;
      }
    }
    await copyPlan();
  };

  return (
    <section className="panel flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Radar className="size-5 text-primary" aria-hidden />
          AI Analysis
        </h2>
        {analysis && (
          <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            SMC · ICT · Wyckoff
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Gemini is reading market structure, liquidity and order flow…
          </p>
        </div>
      )}

      {!loading && !analysis && (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2/30 p-8 text-center">
          <Radar className="size-9 text-muted-foreground" aria-hidden />
          <p className="font-medium">No analysis yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Upload an MT4 / MT5 screenshot to get bias, entry, stop loss, targets, confidence and a
            full institutional breakdown.
          </p>
        </div>
      )}

      {!loading && analysis && (
        <>
          <div ref={exportRef} className="flex animate-[fade-in_.5s_ease-out] flex-col gap-5">
            <BiasBanner analysis={analysis} />

            {analysis.probability != null && (
              <ProbabilityMeter
                value={analysis.probability}
                level={analysis.confidence_level ?? "Low"}
                band={analysis.probability_band}
              />
            )}

            <SessionNewsPanel session={analysis.session} news={analysis.news} />

            {analysis.validation && (
              <div className="glass rounded-xl p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Dual Validation
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${analysis.validation.agreed ? "text-success" : "text-warning"}`}
                >
                  {analysis.validation.agreed ? "AI + rule engine agree" : "No consensus — signal blocked"}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {analysis.validation.detail}
                </p>
              </div>
            )}

            <ConfluencePanel analysis={analysis} />

            {imageSrc && <ChartAnnotation src={imageSrc} analysis={analysis} />}


            <div className="glass flex flex-col items-center gap-5 rounded-2xl p-4 sm:flex-row sm:items-center">
              <ConfidenceGauge value={analysis.confidence} />
              <div className="w-full flex-1">
                <ConfidenceBreakdownList
                  rows={[
                    { label: "Trend Strength", value: analysis.confidence_breakdown.trend },
                    {
                      label: "Market Structure",
                      value: analysis.confidence_breakdown.market_structure,
                    },
                    {
                      label: "Support / Resistance",
                      value: analysis.confidence_breakdown.support_resistance,
                    },
                    { label: "Liquidity", value: analysis.confidence_breakdown.liquidity },
                    { label: "Pattern Quality", value: analysis.confidence_breakdown.pattern },
                    { label: "Risk : Reward", value: analysis.confidence_breakdown.risk_reward },
                    { label: "Overall", value: analysis.confidence },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <MetricCard
                label="Entry Zone"
                value={analysis.entry_zone ?? analysis.entry}
                icon={Crosshair}
                mono
                accent="primary"
              />
              <MetricCard label="Stop Loss" value={analysis.sl} icon={Shield} mono accent="destructive" />
              <MetricCard label="Take Profit" value={analysis.tp} icon={Target} mono accent="success" />
              <MetricCard label="Risk : Reward" value={analysis.rr} icon={Scale} mono />
              <MetricCard label="Pair" value={analysis.pair} icon={LineChart} />
              <MetricCard label="Timeframe" value={analysis.timeframe} icon={Clock} />
              <MetricCard label="HTF Trend" value={analysis.htf_trend ?? ""} icon={Radar} />
              <MetricCard label="Market Condition" value={analysis.market_condition ?? ""} icon={Activity} />
              <MetricCard label="ATR" value={analysis.atr ?? ""} icon={Waves} mono />
              <MetricCard label="RSI" value={analysis.rsi ?? ""} icon={Signal} mono />
              <MetricCard label="EMA" value={analysis.ema ?? ""} icon={LineChart} />
              <MetricCard label="Volume" value={analysis.volume ?? ""} icon={BarChart3} />
              <MetricCard label="Trend" value={analysis.trend} icon={Activity} />

              <MetricCard label="Market Structure" value={analysis.market_structure} icon={BarChart3} />
              <MetricCard label="Pattern" value={analysis.pattern} icon={Signal} />
              <MetricCard label="Support" value={analysis.support} icon={ArrowDownRight} mono accent="success" />
              <MetricCard label="Resistance" value={analysis.resistance} icon={ArrowUpRight} mono accent="destructive" />
              <MetricCard label="Supply Zone" value={analysis.supply_zone} icon={Layers} accent="destructive" />
              <MetricCard label="Demand Zone" value={analysis.demand_zone} icon={Layers} accent="success" />
              <MetricCard label="Liquidity" value={analysis.liquidity} icon={Waves} />
              <MetricCard label="BOS" value={analysis.bos} icon={Zap} accent="primary" />
              <MetricCard label="CHOCH" value={analysis.choch} icon={Zap} accent="warning" />
              <MetricCard label="Fair Value Gap" value={analysis.fvg} icon={Layers} />
            </div>

            <TradeChecklist items={analysis.checklist} />

            <PositionSizeCalculator analysis={analysis} />

            <TradeManagementPanel analysis={analysis} />

            {analysis.ai_explanation && (
              <div className="glass rounded-xl p-4">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Why this signal
                </p>
                <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                  {analysis.ai_explanation}
                </p>
              </div>
            )}

            <div className="glass rounded-xl p-4">
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Trade Summary
              </p>
              <p className="mt-2 text-sm leading-relaxed">{analysis.trade_summary}</p>
              <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Reason: </span>
                {analysis.reason}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={copyPlan}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[.98]"
            >
              <Copy className="size-4" aria-hidden />
              Copy Plan
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              className="glass inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all hover:border-primary/40 active:scale-[.98]"
            >
              <FileText className="size-4" aria-hidden />
              PDF
            </button>
            <button
              type="button"
              onClick={downloadPng}
              className="glass inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all hover:border-primary/40 active:scale-[.98]"
            >
              <Download className="size-4" aria-hidden />
              PNG
            </button>
            <button
              type="button"
              onClick={share}
              className="glass inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all hover:border-primary/40 active:scale-[.98]"
            >
              <Share2 className="size-4" aria-hidden />
              Share
            </button>
            <button
              type="button"
              onClick={onClear}
              className="glass col-span-2 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all hover:border-destructive/40 active:scale-[.98] sm:col-span-1"
            >
              <Eraser className="size-4" aria-hidden />
              Clear
            </button>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        AI generated analysis for educational purposes only. Not financial advice.
      </p>
    </section>
  );
}
