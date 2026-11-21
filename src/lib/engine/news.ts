/** Economic news filter — recurring high-impact event windows (no paid calendar API). */

export interface NewsEvent {
  title: string;
  currency: string;
  at: string; // ISO timestamp
  minutes_away: number; // negative = already released
}

export interface NewsFilter {
  blocked: boolean;
  caution: boolean;
  events: NewsEvent[];
  message: string;
}

const HOUR = 60;

/** Fixed high-impact central-bank decisions (UTC). Extendable without touching logic. */
const SCHEDULED: { title: string; currency: string; iso: string }[] = [
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-01-28T19:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-03-18T18:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-04-29T18:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-06-17T18:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-07-29T18:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-09-16T18:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-11-04T19:00:00Z" },
  { title: "FOMC Interest Rate Decision", currency: "USD", iso: "2026-12-16T19:00:00Z" },
];

function firstFriday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1, 12, 30, 0));
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** Recurring monthly releases for the given month index. */
function recurring(year: number, month: number): { title: string; currency: string; at: Date }[] {
  return [
    { title: "US Non-Farm Payrolls (NFP)", currency: "USD", at: firstFriday(year, month) },
    { title: "US CPI Inflation", currency: "USD", at: new Date(Date.UTC(year, month, 13, 12, 30)) },
    { title: "ECB Rate Decision", currency: "EUR", at: new Date(Date.UTC(year, month, 12, 12, 45)) },
    { title: "UK CPI Inflation", currency: "GBP", at: new Date(Date.UTC(year, month, 17, 6, 0)) },
  ];
}

function candidates(now: Date) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const months = [
    ...recurring(y, m - 1),
    ...recurring(y, m),
    ...recurring(y, m + 1),
  ];
  const fixed = SCHEDULED.map((e) => ({ title: e.title, currency: e.currency, at: new Date(e.iso) }));
  return [...months, ...fixed];
}

/**
 * Flags whether an analysis falls inside a high-impact news window.
 * Blocked: 30 min before to 60 min after a release. Caution: within 4 hours.
 */
export function newsFilter(pair: string, now: Date = new Date()): NewsFilter {
  const symbols = (pair || "").toUpperCase();
  const relevant = (currency: string) =>
    symbols.includes(currency) ||
    (currency === "USD" && /XAU|XAG|GOLD|US30|NAS|SPX|BTC/.test(symbols)) ||
    symbols.length < 3;

  const events: NewsEvent[] = candidates(now)
    .filter((e) => relevant(e.currency))
    .map((e) => ({
      title: e.title,
      currency: e.currency,
      at: e.at.toISOString(),
      minutes_away: Math.round((e.at.getTime() - now.getTime()) / 60000),
    }))
    .filter((e) => e.minutes_away > -HOUR * 2 && e.minutes_away < HOUR * 8)
    .sort((a, b) => Math.abs(a.minutes_away) - Math.abs(b.minutes_away));

  const blocked = events.some((e) => e.minutes_away <= 30 && e.minutes_away >= -60);
  const caution = !blocked && events.some((e) => e.minutes_away > 0 && e.minutes_away <= 4 * HOUR);

  const next = events[0];
  const message = blocked
    ? `High-impact news window: ${next.title} (${next.currency}). Volatility and spread spikes make entries unreliable — stay flat.`
    : caution
      ? `${next.title} (${next.currency}) in ${Math.round(next.minutes_away / 6) / 10}h — reduce size or wait for the release.`
      : "No high-impact news detected around this analysis.";

  return { blocked, caution, events, message };
}
