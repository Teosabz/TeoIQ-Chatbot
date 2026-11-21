/** Stage 1 — extraction prompt and strict normalizer for the Gemini vision response. */

import { num } from "./indicators";
import type { Dir, MarketCondition, TechnicalSnapshot } from "./types";

export const EXTRACTION_PROMPT = `You are a data-extraction engine for an institutional trading desk (ICT, Smart Money Concepts, Price Action, Wyckoff, Supply & Demand, Liquidity, Market Structure).

Look at the uploaded MetaTrader 4 / MetaTrader 5 screenshot and EXTRACT technical data only. Do NOT give a trading recommendation, bias, entry, stop loss or take profit — a separate deterministic engine makes that decision.

Rules:
- Report only what is visible or can be measured from the visible price scale and candles.
- Use numbers (not strings) for price levels, RSI and ATR. Use null when a value genuinely cannot be measured.
- If the higher timeframes are not shown, infer H4/H1 direction from the visible swing structure and say so in "notes"; use "neutral" when truly unclear.
- Rate strengths from 0 to 100 honestly. Weak or untested zones must be rated below 50.
- Volume: set confirms_move true only if volume expands in the direction of the latest move.
- Liquidity sweep: sweep_detected true only for a clear stop hunt beyond a prior high/low; rejected true only if price closed back inside afterwards.
- Return ONLY valid JSON, no markdown, no commentary.

JSON schema:
{"pair":"","timeframe":"","htf_timeframe":"","current_price":0,
"trend":{"h4":"bullish|bearish|neutral","h1":"bullish|bearish|neutral","entry":"bullish|bearish|neutral","strength":0,"note":""},
"ema":{"alignment":"bullish|bearish|neutral","visible":false,"note":""},
"rsi":{"value":0,"state":"bullish|bearish|overbought|oversold|neutral","visible":false},
"atr":{"value":0,"visible":false},
"support":{"level":0,"label":"","strength":0},
"resistance":{"level":0,"label":"","strength":0},
"supply_zone":"","demand_zone":"",
"volume":{"state":"rising|falling|low|average|not visible","confirms_move":false},
"candlestick":{"name":"","direction":"bullish|bearish|neutral","quality":0},
"structure":{"swings":"","hh":false,"hl":false,"lh":false,"ll":false,
"bos":{"detected":false,"direction":"bullish|bearish|neutral","label":""},
"choch":{"detected":false,"direction":"bullish|bearish|neutral","label":""}},
"liquidity":{"label":"","sweep_detected":false,"side":"above highs|below lows|none","rejected":false},
"fvg":"",
"market_condition":"trending|ranging|high volatility|low volatility|unclear",
"notes":"",
"ai_opinion":{"bias":"bullish|bearish|neutral","confidence":0,"rationale":""},
"chart_quality":{"readable":true,"score":0,"issues":""}}`;

// ai_opinion is your own independent read (used only as a second opinion, never as the final call).
// chart_quality: set readable=false and describe the problem when the screenshot is blurry,
// cropped, too small, or the candles/price scale cannot be read reliably.

const asDir = (v: unknown): Dir => {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("bull") || s === "up" || s === "long") return "bullish";
  if (s.startsWith("bear") || s === "down" || s === "short") return "bearish";
  return "neutral";
};
const asBool = (v: unknown) => v === true || String(v).toLowerCase() === "true";
const asStr = (v: unknown, fallback = "Not Visible") => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  return s.length ? s : fallback;
};
const asPct = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const CONDITIONS: MarketCondition[] = ["trending", "ranging", "high volatility", "low volatility", "unclear"];

export function normalizeSnapshot(raw: unknown): TechnicalSnapshot {
  const p = obj(raw);
  const trend = obj(p.trend);
  const ema = obj(p.ema);
  const rsi = obj(p.rsi);
  const atr = obj(p.atr);
  const support = obj(p.support);
  const resistance = obj(p.resistance);
  const volume = obj(p.volume);
  const candle = obj(p.candlestick);
  const structure = obj(p.structure);
  const bos = obj(structure.bos);
  const choch = obj(structure.choch);
  const liquidity = obj(p.liquidity);
  const opinion = obj(p.ai_opinion);
  const quality = obj(p.chart_quality);

  const volState = String(volume.state ?? "not visible").toLowerCase();
  const rsiState = String(rsi.state ?? "neutral").toLowerCase();
  const side = String(liquidity.side ?? "none").toLowerCase();
  const condition = String(p.market_condition ?? "unclear").toLowerCase() as MarketCondition;

  return {
    pair: asStr(p.pair),
    timeframe: asStr(p.timeframe),
    htf_timeframe: asStr(p.htf_timeframe, "H4"),
    current_price: num(p.current_price),
    trend: {
      h4: asDir(trend.h4),
      h1: asDir(trend.h1),
      entry: asDir(trend.entry),
      strength: asPct(trend.strength),
      note: asStr(trend.note, ""),
    },
    ema: { alignment: asDir(ema.alignment), visible: asBool(ema.visible), note: asStr(ema.note, "") },
    rsi: {
      value: num(rsi.value),
      state: (["bullish", "bearish", "overbought", "oversold", "neutral"].includes(rsiState)
        ? rsiState
        : "neutral") as TechnicalSnapshot["rsi"]["state"],
      visible: asBool(rsi.visible),
    },
    atr: { value: num(atr.value), visible: asBool(atr.visible) },
    support: { level: num(support.level), label: asStr(support.label), strength: asPct(support.strength) },
    resistance: {
      level: num(resistance.level),
      label: asStr(resistance.label),
      strength: asPct(resistance.strength),
    },
    supply_zone: asStr(p.supply_zone),
    demand_zone: asStr(p.demand_zone),
    volume: {
      state: (["rising", "falling", "low", "average", "not visible"].includes(volState)
        ? volState
        : "not visible") as TechnicalSnapshot["volume"]["state"],
      confirms_move: asBool(volume.confirms_move),
    },
    candlestick: {
      name: asStr(candle.name),
      direction: asDir(candle.direction),
      quality: asPct(candle.quality),
    },
    structure: {
      swings: asStr(structure.swings),
      hh: asBool(structure.hh),
      hl: asBool(structure.hl),
      lh: asBool(structure.lh),
      ll: asBool(structure.ll),
      bos: { detected: asBool(bos.detected), direction: asDir(bos.direction), label: asStr(bos.label) },
      choch: {
        detected: asBool(choch.detected),
        direction: asDir(choch.direction),
        label: asStr(choch.label),
      },
    },
    liquidity: {
      label: asStr(liquidity.label),
      sweep_detected: asBool(liquidity.sweep_detected),
      side: (["above highs", "below lows", "none"].includes(side)
        ? side
        : "none") as TechnicalSnapshot["liquidity"]["side"],
      rejected: asBool(liquidity.rejected),
    },
    fvg: asStr(p.fvg),
    market_condition: CONDITIONS.includes(condition) ? condition : "unclear",
    notes: asStr(p.notes, ""),
    ai_opinion: {
      bias: asDir(opinion.bias),
      confidence: asPct(opinion.confidence),
      rationale: asStr(opinion.rationale, ""),
    },
    chart_quality: {
      readable: quality.readable === undefined ? true : asBool(quality.readable),
      score: quality.score === undefined ? 100 : asPct(quality.score),
      issues: asStr(quality.issues, ""),
    },
  };
}

/** Extracts the first valid JSON object from a model response (strips code fences/prose). */
export function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}
