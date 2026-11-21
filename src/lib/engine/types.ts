/** Stage 1 (extraction) and Stage 2 (decision) types for the TeoChartIQ engine. */

import type { NewsFilter } from "./news";
import type { SessionInfo } from "./session";
import type { TradingMode } from "./modes";

export type Direction = "BUY" | "SELL" | "NO TRADE";
export type Dir = "bullish" | "bearish" | "neutral";
export type ConfidenceLevel = "High" | "Medium" | "Low";
export type MarketCondition =
  | "trending"
  | "ranging"
  | "high volatility"
  | "low volatility"
  | "unclear";

/** Raw technical data extracted from the chart image — no decisions here. */
export interface TechnicalSnapshot {
  pair: string;
  timeframe: string;
  htf_timeframe: string;
  current_price: number | null;

  trend: { h4: Dir; h1: Dir; entry: Dir; strength: number; note: string };
  ema: { alignment: Dir; visible: boolean; note: string };
  rsi: { value: number | null; state: "bullish" | "bearish" | "overbought" | "oversold" | "neutral"; visible: boolean };
  atr: { value: number | null; visible: boolean };

  support: { level: number | null; label: string; strength: number };
  resistance: { level: number | null; label: string; strength: number };
  supply_zone: string;
  demand_zone: string;

  volume: { state: "rising" | "falling" | "low" | "average" | "not visible"; confirms_move: boolean };
  candlestick: { name: string; direction: Dir; quality: number };

  structure: {
    swings: string; // e.g. "Higher Highs & Higher Lows"
    hh: boolean;
    hl: boolean;
    lh: boolean;
    ll: boolean;
    bos: { detected: boolean; direction: Dir; label: string };
    choch: { detected: boolean; direction: Dir; label: string };
  };

  liquidity: {
    label: string;
    sweep_detected: boolean;
    side: "above highs" | "below lows" | "none";
    rejected: boolean;
  };

  fvg: string;
  market_condition: MarketCondition;
  notes: string;

  /** The vision model's own independent read — used by the dual validation system. */
  ai_opinion: { bias: Dir; confidence: number; rationale: string };
  /** Image quality gate — unreadable charts are rejected before scoring. */
  chart_quality: { readable: boolean; score: number; issues: string };
}

export interface ConfluenceFactor {
  key: string;
  name: string;
  score: number;
  max: number;
  passed: boolean;
  detail: string;
}

export interface RiskPlan {
  entry: number | null;
  entry_low: number | null;
  entry_high: number | null;
  sl: number | null;
  tp: number | null;
  rr: number | null;
  atr: number | null;
  atr_source: "measured" | "estimated" | "unavailable";
}

export interface Validation {
  ai_bias: Dir;
  rule_bias: Dir;
  agreed: boolean;
  detail: string;
}

export interface Decision {
  direction: Direction;
  confluence_score: number;
  confidence_level: ConfidenceLevel;
  probability: number;
  probability_band: "High Probability Trade" | "Medium Probability (Wait for Confirmation)" | "No Trade";
  factors: ConfluenceFactor[];
  reasons: string[];
  risk: RiskPlan;
  validation: Validation;
  session: SessionInfo;
  news: NewsFilter;
  mode: TradingMode;
}
