import { useEffect, useState } from "react";

interface ConfidenceGaugeProps {
  value: number;
  size?: number;
}

/** Animated circular confidence gauge (SVG stroke-dashoffset). */
export function ConfidenceGauge({ value, size = 132 }: ConfidenceGaugeProps) {
  const [shown, setShown] = useState(0);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const tone =
    value >= 75 ? "var(--color-success)" : value >= 50 ? "var(--color-warning)" : "var(--color-destructive)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * shown) / 100}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={value} className="font-display text-3xl font-bold" suffix="%" />
        <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Confidence
        </span>
      </div>
    </div>
  );
}

export function AnimatedNumber({
  value,
  className,
  suffix = "",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let frame = 0;
    const steps = 32;
    const id = setInterval(() => {
      frame += 1;
      const t = 1 - Math.pow(1 - frame / steps, 3);
      setN(Math.round(value * t));
      if (frame >= steps) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [value]);

  return (
    <span className={className}>
      {n}
      {suffix}
    </span>
  );
}

export function ConfidenceBreakdownList({
  rows,
}: {
  rows: { label: string; value: number }[];
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-xs text-muted-foreground">{row.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
              style={{ width: `${row.value}%` }}
            />
          </span>
          <span className="w-10 text-right font-mono text-xs font-semibold">{row.value}%</span>
        </li>
      ))}
    </ul>
  );
}
