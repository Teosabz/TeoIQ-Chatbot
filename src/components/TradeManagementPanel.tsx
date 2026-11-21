import { useMemo, useState } from "react";
import { Activity, ArrowRightLeft, CheckCircle2, ScissorsLineDashed, XCircle } from "lucide-react";
import type { Analysis } from "@/lib/analysis";

type Advice = { icon: typeof Activity; title: string; detail: string; tone: string };

/** Live trade management — recommends BE, trailing, partials or an early exit. */
export function TradeManagementPanel({ analysis }: { analysis: Analysis }) {
  const [price, setPrice] = useState("");
  const isBuy = (analysis.decision ?? analysis.bias) === "BUY";
  const entry =
    analysis.entry_low != null && analysis.entry_high != null
      ? (analysis.entry_low + analysis.entry_high) / 2
      : null;
  const sl = analysis.sl_value ?? null;
  const tp = analysis.tp_value ?? null;

  const advice = useMemo<Advice[]>(() => {
    const current = Number(price);
    if (!price || !Number.isFinite(current) || entry == null || sl == null || tp == null) return [];

    const risk = Math.abs(entry - sl);
    const progress = isBuy ? (current - entry) / risk : (entry - current) / risk;
    const list: Advice[] = [];

    if (progress <= -0.9) {
      list.push({
        icon: XCircle,
        title: "Close / stop about to trigger",
        detail: `Price is ${progress.toFixed(2)}R against you — the ATR stop at ${sl.toFixed(5)} is in play. Do not widen it.`,
        tone: "border-destructive/40 bg-destructive/10 text-destructive",
      });
    } else if (progress < 0.5) {
      list.push({
        icon: Activity,
        title: "Hold — let the setup work",
        detail: `Only ${progress.toFixed(2)}R in profit. Keep the original stop and let structure develop.`,
        tone: "border-border bg-surface-2/60 text-foreground",
      });
    }
    if (progress >= 1) {
      list.push({
        icon: ArrowRightLeft,
        title: "Move stop to break-even",
        detail: `You are ${progress.toFixed(2)}R in profit — move the stop to ${entry.toFixed(5)} to remove risk.`,
        tone: "border-primary/40 bg-primary/10 text-primary",
      });
      list.push({
        icon: ScissorsLineDashed,
        title: "Take partial profit",
        detail: "Bank 30–50% of the position and run the remainder toward the ATR target.",
        tone: "border-warning/40 bg-warning/10 text-warning",
      });
    }
    if (progress >= 1.6) {
      list.push({
        icon: Activity,
        title: "Trail the stop",
        detail: "Trail behind each new higher low (or lower high) / 1x ATR to protect open profit.",
        tone: "border-success/40 bg-success/10 text-success",
      });
    }
    if (progress >= 2.4) {
      list.push({
        icon: CheckCircle2,
        title: "Target reached — close remainder",
        detail: `Price has met the ${tp.toFixed(5)} objective. Close out rather than hoping for extension.`,
        tone: "border-success/40 bg-success/10 text-success",
      });
    }
    if (analysis.news?.blocked) {
      list.push({
        icon: XCircle,
        title: "Close early — news risk",
        detail: analysis.news.message,
        tone: "border-destructive/40 bg-destructive/10 text-destructive",
      });
    }
    return list;
  }, [price, entry, sl, tp, isBuy, analysis.news]);

  if ((analysis.decision ?? analysis.bias) === "NO TRADE") return null;

  return (
    <div className="glass rounded-xl p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Activity className="size-3.5" aria-hidden />
        Live Trade Management
      </p>
      <label className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
        Current market price
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={entry != null ? entry.toFixed(5) : "0.00000"}
          className="rounded-lg border border-border bg-surface-2/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
        />
      </label>

      {advice.length ? (
        <ul className="mt-3 space-y-2">
          {advice.map((a) => (
            <li key={a.title} className={`flex gap-2 rounded-lg border px-3 py-2 ${a.tone}`}>
              <a.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{a.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Enter the live price to get break-even, trailing, partial-profit and early-exit guidance.
        </p>
      )}
    </div>
  );
}
