/** Position sizing — lot size, dollar risk and potential profit from ATR distances. */

export interface PositionInput {
  balance: number;
  riskPercent: number;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  pair: string;
}

export interface PositionResult {
  valid: boolean;
  dollarRisk: number;
  lots: number;
  units: number;
  stopDistance: number;
  pipValue: number;
  potentialProfit: number;
  rr: number;
  note: string;
}

/** Pip size and per-lot pip value (USD account, standard 100k lot approximations). */
function contract(pair: string, entry: number) {
  const p = (pair || "").toUpperCase();
  if (/XAU|GOLD/.test(p)) return { pip: 0.1, pipValue: 10, label: "Gold (100 oz)" };
  if (/XAG|SILVER/.test(p)) return { pip: 0.01, pipValue: 50, label: "Silver (5,000 oz)" };
  if (/US30|NAS|SPX|GER|UK100|JP225/.test(p)) return { pip: 1, pipValue: 1, label: "Index CFD" };
  if (/BTC|ETH/.test(p)) return { pip: 1, pipValue: 1, label: "Crypto CFD" };
  if (/JPY/.test(p) || entry > 50) return { pip: 0.01, pipValue: 9.1, label: "JPY pair (100k)" };
  return { pip: 0.0001, pipValue: 10, label: "FX pair (100k)" };
}

export function calculatePosition(input: PositionInput): PositionResult {
  const { balance, riskPercent, entry, sl, tp, pair } = input;
  const empty: PositionResult = {
    valid: false,
    dollarRisk: 0,
    lots: 0,
    units: 0,
    stopDistance: 0,
    pipValue: 0,
    potentialProfit: 0,
    rr: 0,
    note: "Enter an account balance and risk % — a valid entry and stop loss are required.",
  };
  if (!balance || balance <= 0 || !riskPercent || riskPercent <= 0) return empty;
  if (entry == null || sl == null) return empty;

  const distance = Math.abs(entry - sl);
  if (distance <= 0) return empty;

  const { pip, pipValue, label } = contract(pair, entry);
  const pips = distance / pip;
  const dollarRisk = (balance * riskPercent) / 100;
  const lots = dollarRisk / (pips * pipValue);
  const reward = tp != null ? Math.abs(tp - entry) : 0;
  const rr = reward > 0 ? reward / distance : 0;

  return {
    valid: true,
    dollarRisk: Number(dollarRisk.toFixed(2)),
    lots: Number(lots.toFixed(2)),
    units: Math.round(lots * 100000),
    stopDistance: Number(pips.toFixed(1)),
    pipValue,
    potentialProfit: Number((dollarRisk * rr).toFixed(2)),
    rr: Number(rr.toFixed(2)),
    note: `${label} · stop ${pips.toFixed(1)} pips · ${pipValue}$ per pip per lot.`,
  };
}
