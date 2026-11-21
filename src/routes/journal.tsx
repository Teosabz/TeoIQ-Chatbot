import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  MinusCircle,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { computePerformance, type Bucket } from "@/lib/analytics";
import {
  clearJournal,
  deleteJournalEntry,
  readJournal,
  setOutcome,
  type JournalEntry,
  type Outcome,
} from "@/lib/journal";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trade Journal & Performance — TeoChartIQ AI" },
      {
        name: "description",
        content:
          "Review every AI chart analysis with entry, stop loss, target, confluence score and outcome, plus win rate, average R:R and best pairs and timeframes.",
      },
      { property: "og:title", content: "Trade Journal & Performance — TeoChartIQ AI" },
      {
        property: "og:description",
        content: "Track win rate, average risk:reward and your best performing pairs and timeframes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className={`font-display mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function BucketList({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{title}</p>
      {rows.length ? (
        <ul className="mt-2 space-y-1.5">
          {rows.slice(0, 5).map((b) => (
            <li key={b.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{b.key}</span>
              <span className="font-mono text-muted-foreground">
                {b.trades} trades · {b.win_rate}% win
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No data yet.</p>
      )}
    </div>
  );
}

const OUTCOMES: { id: Outcome; label: string; icon: typeof CheckCircle2; tone: string }[] = [
  { id: "win", label: "Win", icon: CheckCircle2, tone: "text-success border-success/40 bg-success/10" },
  { id: "loss", label: "Loss", icon: XCircle, tone: "text-destructive border-destructive/40 bg-destructive/10" },
  { id: "breakeven", label: "BE", icon: MinusCircle, tone: "text-warning border-warning/40 bg-warning/10" },
];

function EntryCard({
  entry,
  onOutcome,
  onDelete,
}: {
  entry: JournalEntry;
  onOutcome: (o: Outcome) => void;
  onDelete: () => void;
}) {
  const dirTone =
    entry.direction === "BUY"
      ? "text-success"
      : entry.direction === "SELL"
        ? "text-destructive"
        : "text-warning";
  return (
    <li className="glass flex flex-col gap-3 rounded-xl p-3 sm:flex-row">
      {entry.screenshot && (
        <img
          src={entry.screenshot}
          alt={`${entry.pair} chart thumbnail`}
          className="h-20 w-full rounded-lg object-cover sm:w-28"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{entry.pair}</span>
          <span className="text-xs text-muted-foreground">{entry.timeframe}</span>
          <span className={`text-xs font-bold ${dirTone}`}>{entry.direction}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {entry.confluence_score}/100 · {entry.probability}% · {entry.confidence_level}
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          Entry {entry.entry} · SL {entry.sl} · TP {entry.tp} · {entry.rr}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(entry.created_at).toLocaleString()} {entry.session ? `· ${entry.session}` : ""}
          {entry.mode ? ` · ${entry.mode}` : ""}
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{entry.reasoning}</p>
      </div>
      <div className="flex items-center gap-1.5 sm:flex-col">
        {OUTCOMES.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onOutcome(entry.outcome === o.id ? "open" : o.id)}
            aria-label={`Mark as ${o.label}`}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
              entry.outcome === o.id ? o.tone : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <o.icon className="size-3.5" aria-hidden />
            {o.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete journal entry"
          className="inline-flex items-center rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setEntries(readJournal());
  }, []);

  const perf = useMemo(() => computePerformance(entries), [entries]);


  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-6 sm:gap-6 sm:px-6 sm:py-10">
      <AppHeader />

      <section className="panel flex flex-col gap-4 p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="size-5 text-primary" aria-hidden />
          Performance Analytics
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Win Rate" value={`${perf.win_rate}%`} tone="text-success" />
          <Stat label="Loss Rate" value={`${perf.loss_rate}%`} tone="text-destructive" />
          <Stat label="Avg R:R" value={perf.avg_rr ? `1:${perf.avg_rr}` : "—"} />
          <Stat label="Total Trades" value={String(perf.total)} />
          <Stat label="Open" value={String(perf.open)} tone="text-warning" />
          <Stat label="Avg Score" value={`${perf.avg_score}/100`} />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <BucketList title="Best Pairs" rows={perf.pairs} />
          <BucketList title="Best Timeframes" rows={perf.timeframes} />
          <BucketList title="Weekly Performance" rows={perf.weekly} />
          <BucketList title="Monthly Performance" rows={perf.monthly} />
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpenCheck className="size-5 text-primary" aria-hidden />
            AI Trade Journal
          </h2>
          {!!entries.length && (
            <button
              type="button"
              onClick={() => setEntries(clearJournal())}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear all
            </button>
          )}
        </div>

        {entries.length ? (
          <ul className="flex flex-col gap-2.5">
            {entries.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onOutcome={(o) => setEntries(setOutcome(e.id, o))}
                onDelete={() => setEntries(deleteJournalEntry(e.id))}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-surface-2/30 p-8 text-center text-sm text-muted-foreground">
            No journal entries yet — every chart you analyse is saved here automatically.
          </p>
        )}
      </section>
    </main>
  );
}
