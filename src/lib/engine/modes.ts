/** Trading modes — each mode tunes timeframes, risk multipliers and the score threshold. */

export type TradingMode = "scalping" | "day" | "swing";

export interface ModeConfig {
  id: TradingMode;
  label: string;
  timeframes: string;
  htf: string;
  stop_mult: number;
  target_mult: number;
  min_score: number;
  zone_mult: number;
  note: string;
}

export const MODES: Record<TradingMode, ModeConfig> = {
  scalping: {
    id: "scalping",
    label: "Scalping",
    timeframes: "M1 · M5",
    htf: "M15 / H1",
    stop_mult: 1.2,
    target_mult: 2.5,
    min_score: 88,
    zone_mult: 0.2,
    note: "Fast intraday entries — tighter ATR stops and a stricter score threshold to filter noise.",
  },
  day: {
    id: "day",
    label: "Day Trading",
    timeframes: "M15 · H1",
    htf: "H4",
    stop_mult: 1.5,
    target_mult: 2.5,
    min_score: 85,
    zone_mult: 0.3,
    note: "Balanced intraday setups using H4 for trend and M15/H1 for execution.",
  },
  swing: {
    id: "swing",
    label: "Swing Trading",
    timeframes: "H4 · D1",
    htf: "D1 / W1",
    stop_mult: 2,
    target_mult: 3.5,
    min_score: 82,
    zone_mult: 0.45,
    note: "Wider ATR stops and larger targets for multi-day positions.",
  },
};

export function modeConfig(mode: unknown): ModeConfig {
  const id = String(mode ?? "day").toLowerCase() as TradingMode;
  return MODES[id] ?? MODES.day;
}
