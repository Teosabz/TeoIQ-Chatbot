import { Gauge, Zap } from "lucide-react";
import { MODES, type TradingMode } from "@/lib/engine/modes";

/** Trading mode selector — tunes timeframes, ATR risk and the score threshold. */
export function ModeSelector({
  value,
  onChange,
  disabled,
}: {
  value: TradingMode;
  onChange: (mode: TradingMode) => void;
  disabled?: boolean;
}) {
  const cfg = MODES[value];
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Zap className="size-3.5" aria-hidden />
        Trading Mode
      </p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Trading mode">
        {Object.values(MODES).map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={value === m.id}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={`rounded-xl border px-2 py-2 text-center transition-all disabled:opacity-50 ${
              value === m.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface-2/50 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <span className="block text-xs font-semibold">{m.label}</span>
            <span className="block font-mono text-[10px] opacity-80">{m.timeframes}</span>
          </button>
        ))}
      </div>
      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Gauge className="mt-0.5 size-3 shrink-0" aria-hidden />
        {cfg.note} HTF {cfg.htf} · min score {cfg.min_score}/100 · stop {cfg.stop_mult}× ATR.
      </p>
    </div>
  );
}
