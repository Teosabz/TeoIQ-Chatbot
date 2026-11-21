/** Performance analytics computed from the local trade journal. */

import type { JournalEntry } from "./journal";

export interface Bucket {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface Performance {
  total: number;
  closed: number;
  open: number;
  wins: number;
  losses: number;
  win_rate: number;
  loss_rate: number;
  avg_rr: number;
  avg_score: number;
  pairs: Bucket[];
  timeframes: Bucket[];
  weekly: Bucket[];
  monthly: Bucket[];
}

const rrOf = (value: string): number | null => {
  const m = (value || "").match(/1\s*:\s*(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
};

function bucket(entries: JournalEntry[], keyOf: (e: JournalEntry) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const e of entries) {
    const key = keyOf(e) || "—";
    const b = map.get(key) ?? { key, trades: 0, wins: 0, losses: 0, win_rate: 0 };
    b.trades += 1;
    if (e.outcome === "win") b.wins += 1;
    if (e.outcome === "loss") b.losses += 1;
    map.set(key, b);
  }
  return [...map.values()]
    .map((b) => ({ ...b, win_rate: b.wins + b.losses ? Math.round((b.wins / (b.wins + b.losses)) * 100) : 0 }))
    .sort((a, b) => b.win_rate - a.win_rate || b.trades - a.trades);
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function computePerformance(entries: JournalEntry[]): Performance {
  const closed = entries.filter((e) => e.outcome !== "open");
  const wins = closed.filter((e) => e.outcome === "win").length;
  const losses = closed.filter((e) => e.outcome === "loss").length;
  const decided = wins + losses;
  const rrs = entries.map((e) => rrOf(e.rr)).filter((n): n is number => n != null);

  return {
    total: entries.length,
    closed: closed.length,
    open: entries.length - closed.length,
    wins,
    losses,
    win_rate: decided ? Math.round((wins / decided) * 100) : 0,
    loss_rate: decided ? Math.round((losses / decided) * 100) : 0,
    avg_rr: rrs.length ? Number((rrs.reduce((a, b) => a + b, 0) / rrs.length).toFixed(2)) : 0,
    avg_score: entries.length
      ? Math.round(entries.reduce((a, b) => a + (b.confluence_score || 0), 0) / entries.length)
      : 0,
    pairs: bucket(entries, (e) => e.pair),
    timeframes: bucket(entries, (e) => e.timeframe),
    weekly: bucket(entries, (e) => isoWeek(new Date(e.created_at))).sort((a, b) => a.key.localeCompare(b.key)),
    monthly: bucket(entries, (e) => e.created_at.slice(0, 7)).sort((a, b) => a.key.localeCompare(b.key)),
  };
}
