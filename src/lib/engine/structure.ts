/** Market-structure, higher-timeframe and liquidity-sweep interpretation. */

import type { Dir, TechnicalSnapshot } from "./types";

export function structureBias(s: TechnicalSnapshot): Dir {
  const st = s.structure;
  if (st.choch.detected && st.choch.direction !== "neutral") return st.choch.direction;
  if (st.bos.detected && st.bos.direction !== "neutral") return st.bos.direction;
  if (st.hh && st.hl) return "bullish";
  if (st.lh && st.ll) return "bearish";
  return "neutral";
}

/** HTF trend: H4 leads, H1 confirms. Conflict => neutral (no trade). */
export function htfTrend(s: TechnicalSnapshot): Dir {
  const { h4, h1 } = s.trend;
  if (h4 === "neutral") return h1 === "neutral" ? "neutral" : "neutral";
  if (h1 !== "neutral" && h1 !== h4) return "neutral";
  return h4;
}

export function htfAligned(s: TechnicalSnapshot, dir: Dir): boolean {
  const htf = htfTrend(s);
  return htf !== "neutral" && dir !== "neutral" && htf === dir;
}

/** A sweep only counts once price has rejected the liquidity zone. */
export function validSweep(s: TechnicalSnapshot, dir: Dir): boolean {
  const l = s.liquidity;
  if (!l.sweep_detected || !l.rejected) return false;
  if (dir === "bullish") return l.side === "below lows";
  if (dir === "bearish") return l.side === "above highs";
  return false;
}

/** Candidate direction from structure, then HTF trend as tiebreaker. */
export function candidateDirection(s: TechnicalSnapshot): Dir {
  const structural = structureBias(s);
  if (structural !== "neutral") return structural;
  const htf = htfTrend(s);
  if (htf !== "neutral" && s.trend.entry === htf) return htf;
  return "neutral";
}

export function isTradableCondition(c: TechnicalSnapshot["market_condition"]): boolean {
  return c === "trending" || c === "high volatility";
}
