/** Maps the Stage 1 snapshot + Stage 2 decision onto the Analysis shape used by the UI. */

import type { Analysis, ChecklistItem } from "@/lib/analysis";
import { fmt, fmtZone, formatRr } from "./indicators";
import { validSweep } from "./structure";
import type { Decision, TechnicalSnapshot } from "./types";

const dirWord = (d: string) => (d === "bullish" ? "Bullish" : d === "bearish" ? "Bearish" : "Neutral");

function checklist(s: TechnicalSnapshot, decision: Decision): ChecklistItem[] {
  const by = (key: string) => decision.factors.find((f) => f.key === key);
  const items: ChecklistItem[] = [
    { name: "Trend", status: !!by("trend")?.passed },
    { name: "EMA", status: !!by("ema")?.passed },
    { name: "RSI", status: !!by("rsi")?.passed },
    { name: "Support & Resistance", status: !!by("sr")?.passed },
    { name: "Volume", status: !!by("volume")?.passed },
    { name: "Candlestick Pattern", status: !!by("pattern")?.passed },
    { name: "BOS / CHoCH", status: !!by("structure")?.passed },
    { name: "Higher Timeframe Alignment", status: !!by("htf")?.passed },
  ];
  const dir = decision.direction === "BUY" ? "bullish" : decision.direction === "SELL" ? "bearish" : "neutral";
  if (s.liquidity.sweep_detected) {
    items.push({ name: "Liquidity Sweep", status: validSweep(s, dir) || s.liquidity.rejected });
  }
  return items;
}

function summary(s: TechnicalSnapshot, d: Decision): string {
  const price = s.current_price;
  const head =
    d.direction === "NO TRADE"
      ? `No trade on ${s.pair} ${s.timeframe}: the confluence engine scored this chart ${d.confluence_score}/100, below the 85/100 threshold required for a live signal.`
      : `${d.direction} setup on ${s.pair} ${s.timeframe} with a ${d.confluence_score}/100 confluence score and ${d.confidence_level.toLowerCase()} confidence.`;
  const context = `Higher timeframe context is H4 ${dirWord(s.trend.h4)} and H1 ${dirWord(s.trend.h1)}, with the entry timeframe ${dirWord(s.trend.entry)} in a ${s.market_condition} market. Structure reads ${s.structure.swings}${s.structure.bos.detected ? ", with a confirmed Break of Structure" : ""}${s.structure.choch.detected ? " and a Change of Character" : ""}.`;
  const levels = `Key levels: support ${s.support.label} (${s.support.strength}/100) and resistance ${s.resistance.label} (${s.resistance.strength}/100), volume ${s.volume.state}${s.liquidity.sweep_detected ? `, liquidity swept ${s.liquidity.side}${s.liquidity.rejected ? " and rejected" : " without rejection"}` : ""}.`;
  const risk =
    d.direction === "NO TRADE"
      ? "Risk management stays flat until the missing confluences confirm — no trade is a valid decision."
      : `Risk is ATR-based: entry ${fmt(d.risk.entry, price)}, stop ${fmt(d.risk.sl, price)} (1.5x ATR) and target ${fmt(d.risk.tp, price)} (2.5x ATR) for ${formatRr(d.risk.rr)}.`;
  return [head, context, levels, risk].join(" ");
}

/** Plain-language explanation of exactly why the engine reached this decision. */
function explanation(s: TechnicalSnapshot, d: Decision): string {
  const lines = [
    `Trend: entry timeframe ${dirWord(s.trend.entry)} (strength ${s.trend.strength}/100), H4 ${dirWord(s.trend.h4)} and H1 ${dirWord(s.trend.h1)}.`,
    `Market structure: ${s.structure.swings}${s.structure.bos.detected ? ` · BOS ${s.structure.bos.label}` : ""}${s.structure.choch.detected ? ` · CHoCH ${s.structure.choch.label}` : ""}.`,
    `Support & resistance: support ${s.support.label} (${s.support.strength}/100), resistance ${s.resistance.label} (${s.resistance.strength}/100).`,
    `Indicators: EMA ${s.ema.visible ? dirWord(s.ema.alignment) : "not visible"}, RSI ${s.rsi.visible ? `${s.rsi.value ?? ""} ${s.rsi.state}`.trim() : "not visible"}, ATR ${s.atr.visible ? "measured" : "estimated from range"}.`,
    `Volume: ${s.volume.state}${s.volume.confirms_move ? " and confirming the move" : " — move not confirmed"}.`,
    `Liquidity: ${s.liquidity.sweep_detected ? `sweep ${s.liquidity.side}${s.liquidity.rejected ? " with rejection" : " without rejection"}` : "no stop hunt detected"}.`,
    `Session: ${d.session.primary} (${d.session.strength} strength, ${d.session.liquidity}). News: ${d.news.message}`,
    `Validation: ${d.validation.detail}`,
    `Result: ${d.direction} at ${d.probability}% estimated probability (${d.confluence_score}/100 confluence).`,
  ];
  return lines.join("\n");
}

export function toAnalysis(s: TechnicalSnapshot, d: Decision): Analysis {
  const price = s.current_price;
  const by = (key: string) => d.factors.find((f) => f.key === key)?.score ?? 0;
  const pctOf = (key: string) => {
    const f = d.factors.find((x) => x.key === key);
    return f && f.max > 0 ? Math.round((f.score / f.max) * 100) : 0;
  };

  return {
    pair: s.pair,
    timeframe: s.timeframe,
    bias: d.direction,
    pattern: s.candlestick.name,
    market_structure: s.structure.swings,
    trend: `${dirWord(s.trend.entry)}${s.trend.note ? ` — ${s.trend.note}` : ""}`,
    support: s.support.label,
    resistance: s.resistance.label,
    supply_zone: s.supply_zone,
    demand_zone: s.demand_zone,
    liquidity: s.liquidity.sweep_detected
      ? `${s.liquidity.label} · sweep ${s.liquidity.side}${s.liquidity.rejected ? " (rejected)" : ""}`
      : s.liquidity.label,
    bos: s.structure.bos.detected ? s.structure.bos.label : "Not Visible",
    choch: s.structure.choch.detected ? s.structure.choch.label : "Not Visible",
    fvg: s.fvg,
    entry: d.direction === "NO TRADE" ? "No Trade" : fmtZone(d.risk.entry_low, d.risk.entry_high, price),
    sl: d.direction === "NO TRADE" ? "No Trade" : fmt(d.risk.sl, price),
    tp: d.direction === "NO TRADE" ? "No Trade" : fmt(d.risk.tp, price),
    rr: d.direction === "NO TRADE" ? "No Trade" : formatRr(d.risk.rr),
    confidence: d.confluence_score,
    confidence_breakdown: {
      trend: pctOf("trend"),
      market_structure: pctOf("structure"),
      support_resistance: pctOf("sr"),
      liquidity: s.liquidity.sweep_detected && s.liquidity.rejected ? 100 : by("liquidity") > 0 ? 100 : 30,
      pattern: pctOf("pattern"),
      risk_reward: d.risk.rr ? Math.min(100, Math.round((d.risk.rr / 3) * 100)) : 0,
    },
    reason: d.reasons.join(" "),
    trade_summary: summary(s, d),
    checklist: checklist(s, d),

    // Engine additions
    decision: d.direction,
    confluence_score: d.confluence_score,
    confidence_level: d.confidence_level,
    probability_band: d.probability_band,
    market_condition: s.market_condition,
    reasons: d.reasons,
    factors: d.factors.map((f) => ({
      key: f.key,
      name: f.name,
      score: f.score,
      max: f.max,
      passed: f.passed,
      detail: f.detail,
    })),
    entry_zone:
      d.direction === "NO TRADE" ? "No Trade" : fmtZone(d.risk.entry_low, d.risk.entry_high, price),
    entry_price: fmt(d.risk.entry, price),
    entry_low: d.risk.entry_low,
    entry_high: d.risk.entry_high,
    sl_value: d.risk.sl,
    tp_value: d.risk.tp,
    probability: d.probability,
    session: d.session,
    news: d.news,
    validation: d.validation,
    mode: d.mode,
    ai_explanation: explanation(s, d),
    atr: d.risk.atr != null ? `${fmt(d.risk.atr, price)} (${d.risk.atr_source})` : "Not Visible",
    rsi: s.rsi.visible ? `${s.rsi.value ?? ""} ${s.rsi.state}`.trim() : "Not Visible",
    ema: s.ema.visible ? `${dirWord(s.ema.alignment)}${s.ema.note ? ` — ${s.ema.note}` : ""}` : "Not Visible",
    volume: s.volume.state === "not visible" ? "Not Visible" : `${s.volume.state}${s.volume.confirms_move ? " · confirms move" : " · unconfirmed"}`,
    htf_trend: `H4 ${dirWord(s.trend.h4)} · H1 ${dirWord(s.trend.h1)}`,
  };
}
