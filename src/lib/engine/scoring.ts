/** Confluence Scoring System — 0 to 100 points across eight weighted factors. */

import type { ConfluenceFactor, Dir, TechnicalSnapshot } from "./types";
import { htfAligned, htfTrend, structureBias, validSweep } from "./structure";

const WEIGHTS = {
  trend: 15,
  ema: 12,
  rsi: 10,
  sr: 13,
  pattern: 10,
  volume: 10,
  structure: 15,
  htf: 15,
} as const;

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

export function scoreConfluence(s: TechnicalSnapshot, dir: Dir): ConfluenceFactor[] {
  const factors: ConfluenceFactor[] = [];
  const add = (key: string, name: string, score: number, max: number, detail: string) =>
    factors.push({ key, name, score: clamp(score, max), max, passed: score >= max * 0.6, detail });

  // 1. Trend direction on the entry timeframe
  const trendMatch = dir !== "neutral" && s.trend.entry === dir;
  const strength = Math.max(0, Math.min(100, s.trend.strength || 0));
  add(
    "trend",
    "Trend",
    trendMatch ? WEIGHTS.trend * (0.6 + 0.4 * (strength / 100)) : 0,
    WEIGHTS.trend,
    trendMatch ? `Entry timeframe trend is ${s.trend.entry}` : "Entry timeframe trend does not support the setup",
  );

  // 2. EMA alignment
  const emaOk = s.ema.visible && s.ema.alignment === dir;
  add(
    "ema",
    "EMA",
    emaOk ? WEIGHTS.ema : s.ema.visible ? 0 : WEIGHTS.ema * 0.3,
    WEIGHTS.ema,
    s.ema.visible ? `EMA alignment ${s.ema.alignment}` : "EMAs not visible on the chart",
  );

  // 3. RSI confirmation
  let rsiScore = WEIGHTS.rsi * 0.3;
  let rsiDetail = "RSI not visible";
  if (s.rsi.visible) {
    const v = s.rsi.value;
    const bullOk = dir === "bullish" && (s.rsi.state === "bullish" || s.rsi.state === "oversold" || (v != null && v > 50 && v < 70));
    const bearOk = dir === "bearish" && (s.rsi.state === "bearish" || s.rsi.state === "overbought" || (v != null && v < 50 && v > 30));
    const exhausted = (dir === "bullish" && s.rsi.state === "overbought") || (dir === "bearish" && s.rsi.state === "oversold");
    rsiScore = exhausted ? 0 : bullOk || bearOk ? WEIGHTS.rsi : WEIGHTS.rsi * 0.2;
    rsiDetail = exhausted
      ? `RSI ${s.rsi.state} against the setup`
      : `RSI ${v ?? s.rsi.state}`;
  }
  add("rsi", "RSI", rsiScore, WEIGHTS.rsi, rsiDetail);

  // 4. Support & Resistance quality (weak zones are ignored)
  const zone = dir === "bullish" ? s.support : s.resistance;
  const zoneStrength = Math.max(0, Math.min(100, zone.strength || 0));
  const zoneValid = zone.level != null && zoneStrength >= 50;
  add(
    "sr",
    "Support & Resistance",
    zoneValid ? WEIGHTS.sr * (zoneStrength / 100) : 0,
    WEIGHTS.sr,
    zoneValid
      ? `${dir === "bullish" ? "Support" : "Resistance"} ${zone.label} rated ${zoneStrength}/100`
      : "No strong key level near price",
  );

  // 5. Candlestick pattern
  const patternOk = s.candlestick.direction === dir && s.candlestick.quality >= 50;
  add(
    "pattern",
    "Candlestick Pattern",
    patternOk ? WEIGHTS.pattern * (s.candlestick.quality / 100) : 0,
    WEIGHTS.pattern,
    patternOk ? `${s.candlestick.name} (${s.candlestick.quality}/100)` : "No confirming candlestick pattern",
  );

  // 6. Volume confirmation — low-volume breakouts score zero
  const volOk = s.volume.confirms_move && (s.volume.state === "rising" || s.volume.state === "average");
  add(
    "volume",
    "Volume",
    volOk ? WEIGHTS.volume : s.volume.state === "not visible" ? WEIGHTS.volume * 0.3 : 0,
    WEIGHTS.volume,
    s.volume.state === "not visible" ? "Volume not visible" : `Volume ${s.volume.state}${volOk ? " and supporting" : " — move unconfirmed"}`,
  );

  // 7. Market structure (BOS / CHoCH / swing sequence)
  const sBias = structureBias(s);
  const structOk = sBias === dir;
  const bonus = (s.structure.bos.detected ? 0.2 : 0) + (s.structure.choch.detected ? 0.2 : 0);
  add(
    "structure",
    "BOS / CHoCH",
    structOk ? WEIGHTS.structure * Math.min(1, 0.6 + bonus) : 0,
    WEIGHTS.structure,
    structOk ? `${s.structure.swings}${s.structure.bos.detected ? " · BOS" : ""}${s.structure.choch.detected ? " · CHoCH" : ""}` : "Structure does not support the setup",
  );

  // 8. Higher timeframe alignment
  const htf = htfTrend(s);
  const aligned = htfAligned(s, dir);
  add(
    "htf",
    "Higher Timeframe",
    aligned ? WEIGHTS.htf : 0,
    WEIGHTS.htf,
    aligned ? `H4/H1 trend ${htf}` : htf === "neutral" ? "H4 and H1 disagree or are unclear" : `Setup opposes the ${htf} higher timeframe trend`,
  );

  // Bonus: confirmed liquidity sweep (capped at 100 overall)
  const sweep = validSweep(s, dir);
  factors.push({
    key: "liquidity",
    name: "Liquidity Sweep",
    score: sweep ? 5 : 0,
    max: 5,
    passed: sweep,
    detail: sweep ? `Sweep ${s.liquidity.side} rejected` : "No confirmed liquidity sweep",
  });

  return factors;
}

export function totalScore(factors: ConfluenceFactor[]): number {
  return Math.max(0, Math.min(100, Math.round(factors.reduce((sum, f) => sum + f.score, 0))));
}
