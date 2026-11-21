import { Gauge } from "lucide-react";

/** Probability of success meter with High / Medium / Low confidence label. */
export function ProbabilityMeter({
  value,
  level,
  band,
}: {
  value: number;
  level: string;
  band?: string;
}) {
  const tone = value >= 80 ? "text-success" : value >= 60 ? "text-warning" : "text-muted-foreground";
  const bar = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-muted-foreground";

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <Gauge className="size-3.5" aria-hidden />
            Probability of Success
          </p>
          <p className={`font-display mt-1 text-3xl leading-none font-bold ${tone}`}>{value}%</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${tone}`}>{level} confidence</p>
          {band && <p className="text-[11px] text-muted-foreground">{band}</p>}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
