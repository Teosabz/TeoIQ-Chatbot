/** AI Trade Journal — every analysis is stored locally with its outcome. */

import type { Analysis } from "./analysis";

export type Outcome = "win" | "loss" | "breakeven" | "open";

export interface JournalEntry {
  id: string;
  created_at: string;
  screenshot?: string;
  pair: string;
  timeframe: string;
  direction: string;
  entry: string;
  sl: string;
  tp: string;
  rr: string;
  confluence_score: number;
  confidence_level: string;
  probability: number;
  reasoning: string;
  session?: string;
  mode?: string;
  outcome: Outcome;
}

const KEY = "teochart_journal_v1";
const LIMIT = 200;

export function readJournal(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as JournalEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: JournalEntry[]): JournalEntry[] {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)));
  } catch {
    /* storage full — journal is best-effort */
  }
  return items.slice(0, LIMIT);
}

export function addJournalEntry(a: Analysis, screenshot?: string): JournalEntry[] {
  const entry: JournalEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    created_at: new Date().toISOString(),
    screenshot,
    pair: a.pair,
    timeframe: a.timeframe,
    direction: a.decision ?? a.bias,
    entry: a.entry_zone ?? a.entry,
    sl: a.sl,
    tp: a.tp,
    rr: a.rr,
    confluence_score: a.confluence_score ?? a.confidence,
    confidence_level: a.confidence_level ?? "—",
    probability: a.probability ?? a.confidence,
    reasoning: a.ai_explanation ?? a.trade_summary,
    session: a.session?.primary,
    mode: a.mode,
    outcome: "open",
  };
  return persist([entry, ...readJournal()]);
}

export function setOutcome(id: string, outcome: Outcome): JournalEntry[] {
  return persist(readJournal().map((e) => (e.id === id ? { ...e, outcome } : e)));
}

export function deleteJournalEntry(id: string): JournalEntry[] {
  return persist(readJournal().filter((e) => e.id !== id));
}

export function clearJournal(): JournalEntry[] {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return [];
}
