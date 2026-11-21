/** Stage 2 — turns the extracted snapshot into a scored, risk-managed decision. */

import { buildRiskPlan } from "./indicators";
import { modeConfig, type TradingMode } from "./modes";
import { newsFilter } from "./news";
import { detectSession } from "./session";
import { scoreConfluence, totalScore } from "./scoring";
import { candidateDirection, htfAligned, htfTrend, isTradableCondition } from "./structure";
import { validate } from "./validation";
import type { ConfidenceLevel, Decision, Dir, RiskPlan, TechnicalSnapshot } from "./types";

const MIN_RR = 2;

function level(score: number): ConfidenceLevel {
  if (score >= 85) return "High";
  if (score >= 70) return "Medium";
  return "Low";
}

export interface DecideOptions {
  mode?: TradingMode;
  now?: Date;
}

export function decide(s: TechnicalSnapshot, options: DecideOptions = {}): Decision {
  const cfg = modeConfig(options.mode);
  const now = options.now ?? new Date();
  const session = detectSession(now);
  const news = newsFilter(s.pair, now);

  const dir: Dir = candidateDirection(s);
  const factors = scoreConfluence(s, dir);
  const score = totalScore(factors);
  const validation = validate(s, dir);
  const reasons: string[] = [];

  const side = dir === "bullish" ? "BUY" : dir === "bearish" ? "SELL" : null;
  const empty: RiskPlan = {
    entry: s.current_price,
    entry_low: null,
    entry_high: null,
    sl: null,
    tp: null,
    rr: null,
    atr: null,
    atr_source: "unavailable",
  };
  const risk = side ? buildRiskPlan(s, side, cfg.id) : empty;

  let direction: Decision["direction"] = "NO TRADE";

  if (!s.chart_quality.readable) {
    reasons.push(
      `Chart quality too low to analyse${s.chart_quality.issues ? `: ${s.chart_quality.issues}` : ""}. Upload a clearer, full-screen screenshot.`,
    );
  } else if (!side) {
    reasons.push("No directional bias: market structure and higher timeframe trend do not agree.");
  } else {
    if (!htfAligned(s, dir)) {
      reasons.push(
        htfTrend(s) === "neutral"
          ? "H4 and H1 trends conflict — no higher timeframe confirmation."
          : `Setup would trade against the ${htfTrend(s)} H4 trend.`,
      );
    }
    if (!isTradableCondition(s.market_condition)) {
      reasons.push(`Market condition is ${s.market_condition} — poor environment for a directional entry.`);
    }
    if (risk.rr == null || risk.rr < MIN_RR) {
      reasons.push("Risk-to-reward below the 1:2 minimum with ATR-based stops.");
    }
    if (score < cfg.min_score) {
      reasons.push(`Confluence score ${score}/100 is below the ${cfg.min_score}/100 ${cfg.label.toLowerCase()} threshold.`);
    }
    if (!validation.agreed) {
      reasons.push(`Dual validation failed — ${validation.detail}`);
    }
    if (news.blocked) {
      reasons.push(news.message);
    }

    if (reasons.length === 0) {
      direction = side;
      reasons.push(
        `${score}/100 confluence with ${htfTrend(s)} higher timeframe alignment, valid structure, AI/rule-engine consensus and ATR-based risk (${cfg.stop_mult}x ATR stop, ${cfg.target_mult}x ATR target).`,
      );
      if (news.caution) reasons.push(news.message);
      if (session.strength === "Low") {
        reasons.push(`${session.primary} — ${session.liquidity.toLowerCase()} liquidity, consider reducing size.`);
      }
    }
  }

  const failed = factors.filter((f) => !f.passed && f.key !== "liquidity");
  if (direction === "NO TRADE" && failed.length && s.chart_quality.readable) {
    reasons.push(`Missing confluence: ${failed.map((f) => f.name).join(", ")}.`);
  }

  const band: Decision["probability_band"] =
    direction !== "NO TRADE"
      ? "High Probability Trade"
      : score >= 70
        ? "Medium Probability (Wait for Confirmation)"
        : "No Trade";

  // Probability blends the rule score with the AI's own confidence and context penalties.
  const blended = score * 0.75 + s.ai_opinion.confidence * 0.25;
  const penalty =
    (validation.agreed ? 0 : 15) +
    (news.blocked ? 15 : news.caution ? 5 : 0) +
    (session.strength === "High" ? 0 : session.strength === "Medium" ? 3 : 8);
  const probability = Math.max(5, Math.min(98, Math.round(blended - penalty)));

  return {
    direction,
    confluence_score: score,
    confidence_level: level(score),
    probability,
    probability_band: band,
    factors,
    reasons,
    risk:
      direction === "NO TRADE"
        ? { ...risk, entry_low: null, entry_high: null, sl: null, tp: null, rr: risk.rr }
        : risk,
    validation,
    session,
    news,
    mode: cfg.id,
  };
}
