/** Dual validation — the vision model's read must agree with the rule-based engine. */

import type { Dir, TechnicalSnapshot, Validation } from "./types";

export function validate(s: TechnicalSnapshot, ruleBias: Dir): Validation {
  const aiBias = s.ai_opinion.bias;
  const agreed = ruleBias !== "neutral" && aiBias === ruleBias;
  return {
    ai_bias: aiBias,
    rule_bias: ruleBias,
    agreed,
    detail: agreed
      ? `Gemini and the rule engine both read the chart as ${ruleBias} (AI confidence ${s.ai_opinion.confidence}/100).`
      : ruleBias === "neutral"
        ? "The rule engine found no valid directional setup."
        : `Gemini reads the chart as ${aiBias} while the rule engine reads ${ruleBias} — no consensus.`,
  };
}
