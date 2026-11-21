import type { SessionInfo } from "./engine/session";
import type { NewsFilter } from "./engine/news";
import type { Validation } from "./engine/types";
import type { TradingMode } from "./engine/modes";

/** Shared analysis types + local history helpers (browser storage, no database). */

export type Bias = "BUY" | "SELL" | "WAIT";

export interface ConfidenceBreakdown {
  trend: number;
  market_structure: number;
  support_resistance: number;
  liquidity: number;
  pattern: number;
  risk_reward: number;
}

export interface ChecklistItem {
  name: string;
  status: boolean;
}

export interface ConfluenceFactorView {
  key: string;
  name: string;
  score: number;
  max: number;
  passed: boolean;
  detail: string;
}

export interface Analysis {
  pair: string;
  timeframe: string;
  bias: string;
  pattern: string;
  market_structure: string;
  trend: string;
  support: string;
  resistance: string;
  supply_zone: string;
  demand_zone: string;
  liquidity: string;
  bos: string;
  choch: string;
  fvg: string;
  entry: string;
  sl: string;
  tp: string;
  rr: string;
  confidence: number;
  confidence_breakdown: ConfidenceBreakdown;
  reason: string;
  trade_summary: string;
  checklist: ChecklistItem[];

  /** Confluence engine fields (optional for older stored history items). */
  decision?: "BUY" | "SELL" | "NO TRADE";
  confluence_score?: number;
  confidence_level?: "High" | "Medium" | "Low";
  probability_band?: string;
  market_condition?: string;
  reasons?: string[];
  factors?: ConfluenceFactorView[];
  atr?: string;
  rsi?: string;
  ema?: string;
  volume?: string;
  htf_trend?: string;

  /** Pro-tier fields (entry zones, probability, session, news, dual validation). */
  entry_zone?: string;
  entry_price?: string;
  entry_low?: number | null;
  entry_high?: number | null;
  sl_value?: number | null;
  tp_value?: number | null;
  probability?: number;
  session?: SessionInfo;
  news?: NewsFilter;
  validation?: Validation;
  mode?: TradingMode;
  ai_explanation?: string;
}


export interface HistoryItem extends Analysis {
  id: string;
  created_at: string;
  thumbnail?: string;
}

const HISTORY_KEY = "teochart_history_v2";
const HISTORY_LIMIT = 10;

export function normalizeBias(value: string): Bias {
  const v = (value || "").trim().toUpperCase();
  if (v.startsWith("BUY") || v.startsWith("LONG")) return "BUY";
  if (v.startsWith("SELL") || v.startsWith("SHORT")) return "SELL";
  return "WAIT";
}

export function biasTone(bias: string) {
  const value = normalizeBias(bias);
  if (value === "BUY")
    return { value, text: "text-success", border: "border-success/40", bg: "bg-success/12" };
  if (value === "SELL")
    return {
      value,
      text: "text-destructive",
      border: "border-destructive/40",
      bg: "bg-destructive/12",
    };
  return { value, text: "text-warning", border: "border-warning/40", bg: "bg-warning/12" };
}

/** Parses a possibly messy price string ("1.0842 area") into a number. */
export function parsePrice(value: string): number | null {
  const match = (value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function isVisible(value: string): boolean {
  const v = (value || "").trim().toLowerCase();
  return v.length > 0 && v !== "not visible" && v !== "n/a" && v !== "none";
}

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function persist(items: HistoryItem[]): HistoryItem[] {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage full — history is best-effort */
  }
  return items;
}

export function saveToHistory(analysis: Analysis, thumbnail?: string): HistoryItem[] {
  const item: HistoryItem = {
    ...analysis,
    thumbnail,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    created_at: new Date().toISOString(),
  };
  return persist([item, ...readHistory()].slice(0, HISTORY_LIMIT));
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  return persist(readHistory().filter((i) => i.id !== id));
}

export function clearHistory(): HistoryItem[] {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function buildTradePlan(a: Analysis): string {
  return [
    "📊 TeoChartIQ AI — Trade Plan",
    "──────────────────────────────",
    `Pair:            ${a.pair}`,
    `Timeframe:       ${a.timeframe}`,
    `Direction:       ${a.decision ?? normalizeBias(a.bias)}`,
    `Confluence:      ${a.confluence_score ?? a.confidence}/100`,
    `Probability:     ${a.probability != null ? `${a.probability}%` : "—"}`,
    `Session:         ${a.session ? `${a.session.primary} (${a.session.strength})` : "—"}`,
    `Confidence:      ${a.confidence_level ?? "—"}`,
    `Market:          ${a.market_condition ?? "—"}`,
    "",
    `Entry Zone:      ${a.entry_zone ?? a.entry}`,
    `Stop Loss:       ${a.sl}`,
    `Take Profit:     ${a.tp}`,
    `Risk : Reward:   ${a.rr}`,
    "",
    `Reason:          ${a.reason}`,
    "",

    "Trade Summary:",
    a.trade_summary,
    "",
    "AI generated — educational purposes only. Not financial advice.",
  ].join("\n");
}
