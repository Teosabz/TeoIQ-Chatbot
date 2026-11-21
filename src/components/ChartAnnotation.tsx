import { useMemo, useState } from "react";
import { Image as ImageIcon, PenLine } from "lucide-react";
import { isVisible, normalizeBias, parsePrice, type Analysis } from "@/lib/analysis";

interface ChartAnnotationProps {
  src: string;
  analysis: Analysis;
}

interface Level {
  key: string;
  label: string;
  price: number;
  color: string;
  dashed?: boolean;
}

/**
 * Overlays SVG annotations on the uploaded chart.
 * Price levels are mapped onto the image height using the min/max of all
 * detected levels, so lines stay in a plausible relative position.
 */
export function ChartAnnotation({ src, analysis }: ChartAnnotationProps) {
  const [annotated, setAnnotated] = useState(true);
  const bias = normalizeBias(analysis.bias);

  const { levels, zones } = useMemo(() => {
    const raw: Level[] = [
      { key: "tp", label: "TP", price: parsePrice(analysis.tp) ?? NaN, color: "var(--color-success)" },
      { key: "entry", label: "ENTRY", price: parsePrice(analysis.entry) ?? NaN, color: "var(--color-primary)" },
      { key: "sl", label: "SL", price: parsePrice(analysis.sl) ?? NaN, color: "var(--color-destructive)" },
      {
        key: "res",
        label: "RESISTANCE",
        price: parsePrice(analysis.resistance) ?? NaN,
        color: "var(--color-warning)",
        dashed: true,
      },
      {
        key: "sup",
        label: "SUPPORT",
        price: parsePrice(analysis.support) ?? NaN,
        color: "var(--color-warning)",
        dashed: true,
      },
    ].filter((l) => Number.isFinite(l.price));

    const supply = parsePrice(analysis.supply_zone);
    const demand = parsePrice(analysis.demand_zone);
    const all = [...raw.map((l) => l.price), supply, demand].filter(
      (n): n is number => n != null && Number.isFinite(n),
    );
    if (all.length < 2) return { levels: [] as (Level & { y: number })[], zones: [] as { y: number; color: string; label: string }[] };

    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min || 1;
    const pad = 12;
    const toY = (p: number) => pad + (1 - (p - min) / span) * (100 - pad * 2);

    return {
      levels: raw.map((l) => ({ ...l, y: toY(l.price) })),
      zones: [
        supply != null && Number.isFinite(supply)
          ? { y: toY(supply), color: "var(--color-destructive)", label: "SUPPLY" }
          : null,
        demand != null && Number.isFinite(demand)
          ? { y: toY(demand), color: "var(--color-success)", label: "DEMAND" }
          : null,
      ].filter(Boolean) as { y: number; color: string; label: string }[],
    };
  }, [analysis]);

  const tags = [
    isVisible(analysis.bos) ? { text: "BOS", tone: "var(--color-primary)" } : null,
    isVisible(analysis.choch) ? { text: "CHOCH", tone: "var(--color-warning)" } : null,
    isVisible(analysis.fvg) ? { text: "FVG", tone: "var(--color-accent)" } : null,
    isVisible(analysis.liquidity) ? { text: "LIQUIDITY", tone: "var(--color-destructive)" } : null,
  ].filter(Boolean) as { text: string; tone: string }[];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Chart View
        </p>
        <div className="inline-flex rounded-lg border border-border bg-surface-2/60 p-0.5">
          {[
            { id: false, label: "Original", icon: ImageIcon },
            { id: true, label: "Annotated", icon: PenLine },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setAnnotated(id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                annotated === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-black/40">
        <img src={src} alt="Analyzed MetaTrader chart" className="w-full object-contain" />

        {annotated && (
          <svg
            className="absolute inset-0 size-full animate-[fade-in_.4s_ease-out]"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label="Annotated chart overlay"
          >
            {zones.map((z) => (
              <rect
                key={z.label}
                x="0"
                y={Math.max(0, z.y - 3)}
                width="100"
                height="6"
                fill={z.color}
                opacity="0.16"
              />
            ))}
            {levels.map((l) => (
              <line
                key={l.key}
                x1="0"
                x2="100"
                y1={l.y}
                y2={l.y}
                stroke={l.color}
                strokeWidth="0.4"
                strokeDasharray={l.dashed ? "1.5 1.5" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        )}

        {annotated && (
          <div className="pointer-events-none absolute inset-0">
            {levels.map((l) => (
              <span
                key={l.key}
                className="absolute left-2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-black"
                style={{ top: `${l.y}%`, backgroundColor: l.color }}
              >
                {l.label} {l.price}
              </span>
            ))}
            {zones.map((z, i) => (
              <span
                key={z.label}
                className="absolute right-2 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-black"
                style={{ top: `${z.y}%`, backgroundColor: z.color, marginTop: i * 2 }}
              >
                {z.label}
              </span>
            ))}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t.text}
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                  style={{ backgroundColor: t.tone }}
                >
                  {t.text}
                </span>
              ))}
              {bias !== "WAIT" && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                  style={{
                    backgroundColor:
                      bias === "BUY" ? "var(--color-success)" : "var(--color-destructive)",
                  }}
                >
                  {bias === "BUY" ? "↑ UPTREND BIAS" : "↓ DOWNTREND BIAS"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {annotated && levels.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No numeric price levels were detected, so only structural tags are shown.
        </p>
      )}
    </div>
  );
}
