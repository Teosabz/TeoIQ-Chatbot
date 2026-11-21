/** Price / ATR helpers and dynamic risk management (mode-tuned ATR stops and targets). */

import { modeConfig, type TradingMode } from "./modes";
import type { RiskPlan, TechnicalSnapshot } from "./types";

export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

/** Decimal precision inferred from the instrument price (5 for FX, 2 for indices/metals). */
export function precisionFor(price: number | null): number {
  if (price == null) return 2;
  const abs = Math.abs(price);
  if (abs < 10) return 5;
  if (abs < 500) return 3;
  return 2;
}

export function fmt(value: number | null, price: number | null): string {
  if (value == null) return "Not Visible";
  return value.toFixed(precisionFor(price));
}

export function fmtZone(low: number | null, high: number | null, price: number | null): string {
  if (low == null || high == null) return "Not Visible";
  return `${fmt(low, price)} – ${fmt(high, price)}`;
}

/**
 * ATR fallback: when the indicator is not on the chart, approximate volatility
 * from the visible support/resistance range (~25% of the range per bar).
 */
export function resolveAtr(s: TechnicalSnapshot): { atr: number | null; source: RiskPlan["atr_source"] } {
  if (s.atr.value && s.atr.value > 0) return { atr: s.atr.value, source: "measured" };
  const hi = s.resistance.level;
  const lo = s.support.level;
  if (hi != null && lo != null && hi > lo) {
    const range = hi - lo;
    if (range > 0) return { atr: range * 0.25, source: "estimated" };
  }
  const price = s.current_price;
  if (price != null && price > 0) return { atr: price * 0.002, source: "estimated" };
  return { atr: null, source: "unavailable" };
}

/** Builds an ATR-based plan with an entry ZONE, mode-tuned stop and target (RR >= 1:2). */
export function buildRiskPlan(
  s: TechnicalSnapshot,
  direction: "BUY" | "SELL",
  mode: TradingMode = "day",
): RiskPlan {
  const cfg = modeConfig(mode);
  const { atr, source } = resolveAtr(s);
  const entry = s.current_price ?? s.support.level ?? s.resistance.level ?? null;
  if (entry == null || atr == null || atr <= 0) {
    return { entry, entry_low: null, entry_high: null, sl: null, tp: null, rr: null, atr, atr_source: source };
  }
  const risk = cfg.stop_mult * atr;
  // TP respects the mode target and never falls below the 1:2 minimum risk-to-reward.
  const reward = Math.max(cfg.target_mult * atr, 2 * risk);
  const sl = direction === "BUY" ? entry - risk : entry + risk;
  const tp = direction === "BUY" ? entry + reward : entry - reward;
  const pad = cfg.zone_mult * atr;
  // Realistic entry range around the trigger price rather than one exact fill.
  const entry_low = direction === "BUY" ? entry - pad : entry;
  const entry_high = direction === "BUY" ? entry : entry + pad;
  return { entry, entry_low, entry_high, sl, tp, rr: reward / risk, atr, atr_source: source };
}

export function formatRr(rr: number | null): string {
  if (rr == null || !Number.isFinite(rr)) return "Not Visible";
  return `1:${rr.toFixed(2).replace(/\.00$/, "")}`;
}
