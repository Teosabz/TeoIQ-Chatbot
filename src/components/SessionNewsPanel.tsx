import { AlertTriangle, CalendarClock, Globe2, ShieldCheck } from "lucide-react";
import type { NewsFilter } from "@/lib/engine/news";
import type { SessionInfo } from "@/lib/engine/session";

/** Active trading session + high-impact economic news warning. */
export function SessionNewsPanel({ session, news }: { session?: SessionInfo; news?: NewsFilter }) {
  if (!session && !news) return null;

  const tone = news?.blocked
    ? { border: "border-destructive/40", bg: "bg-destructive/10", text: "text-destructive" }
    : news?.caution
      ? { border: "border-warning/40", bg: "bg-warning/10", text: "text-warning" }
      : { border: "border-success/30", bg: "bg-success/8", text: "text-success" };

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {session && (
        <div className="glass rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <Globe2 className="size-3.5" aria-hidden />
            Trading Session
          </p>
          <p className="font-display mt-1 text-lg font-bold">{session.primary}</p>
          <p className="text-xs text-muted-foreground">
            {session.strength} strength · {session.liquidity} · {session.utc_time}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{session.note}</p>
        </div>
      )}

      {news && (
        <div className={`rounded-xl border p-4 ${tone.border} ${tone.bg}`}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {news.blocked || news.caution ? (
              <AlertTriangle className="size-3.5" aria-hidden />
            ) : (
              <ShieldCheck className="size-3.5" aria-hidden />
            )}
            Economic News Filter
          </p>
          <p className={`mt-1 text-sm font-semibold ${tone.text}`}>
            {news.blocked ? "Avoid trading — news window" : news.caution ? "Caution — news ahead" : "Clear"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{news.message}</p>
          {!!news.events.length && (
            <ul className="mt-2 space-y-1 border-t border-border pt-2">
              {news.events.slice(0, 3).map((e) => (
                <li
                  key={`${e.title}-${e.at}`}
                  className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <CalendarClock className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">
                      {e.title} ({e.currency})
                    </span>
                  </span>
                  <span className="font-mono shrink-0">
                    {e.minutes_away >= 0
                      ? `in ${e.minutes_away < 60 ? `${e.minutes_away}m` : `${(e.minutes_away / 60).toFixed(1)}h`}`
                      : `${Math.abs(e.minutes_away)}m ago`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
