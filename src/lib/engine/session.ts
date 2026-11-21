/** Trading-session detection (pure, UTC based) — Sydney / Tokyo / London / New York. */

export type SessionName = "Sydney" | "Tokyo" | "London" | "New York";

export interface SessionInfo {
  active: SessionName[];
  primary: SessionName | "Off Hours";
  strength: "High" | "Medium" | "Low";
  liquidity: string;
  note: string;
  utc_time: string;
}

interface Window {
  name: SessionName;
  open: number; // UTC hour, inclusive
  close: number; // UTC hour, exclusive
  weight: number;
}

const WINDOWS: Window[] = [
  { name: "Sydney", open: 21, close: 6, weight: 1 },
  { name: "Tokyo", open: 23, close: 8, weight: 2 },
  { name: "London", open: 7, close: 16, weight: 4 },
  { name: "New York", open: 12, close: 21, weight: 4 },
];

const inWindow = (hour: number, w: Window) =>
  w.open < w.close ? hour >= w.open && hour < w.close : hour >= w.open || hour < w.close;

/** Detects which FX sessions are open and how much liquidity to expect. */
export function detectSession(now: Date = new Date()): SessionInfo {
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  const weekend = day === 6 || (day === 0 && hour < 21) || (day === 5 && hour >= 21);

  const active = WINDOWS.filter((w) => inWindow(hour, w));
  const total = active.reduce((sum, w) => sum + w.weight, 0);
  const utc_time = `${String(hour).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC`;

  if (weekend) {
    return {
      active: [],
      primary: "Off Hours",
      strength: "Low",
      liquidity: "Market closed",
      note: "Forex market is closed for the weekend — spreads and gaps make execution unreliable.",
      utc_time,
    };
  }

  if (!active.length) {
    return {
      active: [],
      primary: "Off Hours",
      strength: "Low",
      liquidity: "Thin",
      note: "No major session open — expect thin liquidity and wider spreads.",
      utc_time,
    };
  }

  const overlap = active.length > 1 && total >= 6;
  const strength: SessionInfo["strength"] = overlap ? "High" : total >= 4 ? "Medium" : "Low";
  const primary = active.slice().sort((a, b) => b.weight - a.weight)[0].name;

  return {
    active: active.map((w) => w.name),
    primary,
    strength,
    liquidity: overlap ? "Peak (session overlap)" : strength === "Medium" ? "Good" : "Moderate",
    note: overlap
      ? `${active.map((w) => w.name).join(" / ")} overlap — highest liquidity and cleanest institutional order flow.`
      : `${primary} session is active with ${strength.toLowerCase()} participation.`,
    utc_time,
  };
}
