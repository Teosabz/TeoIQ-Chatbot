import { History, ImageOff, Trash2, X } from "lucide-react";
import { biasTone, type HistoryItem } from "@/lib/analysis";

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ items, onSelect, onDelete, onClear }: HistoryPanelProps) {
  return (
    <section className="panel flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <History className="size-5 text-muted-foreground" aria-hidden />
          Recent Analyses
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {items.length}/10
          </span>
        </h2>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Your last 10 analyses will appear here, stored privately in this browser.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const tone = biasTone(item.bias);
            return (
              <li key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="glass flex w-full gap-3 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50"
                >
                  <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={`${item.pair} chart thumbnail`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{item.pair}</span>
                      <span className={`text-xs font-bold ${tone.text}`}>{tone.value}</span>
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                      {item.timeframe} · {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${item.confidence}%` }}
                        />
                      </span>
                      <span className="font-mono text-[11px] font-semibold">
                        {item.confidence}%
                      </span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete analysis for ${item.pair}`}
                  className="absolute top-1.5 right-1.5 rounded-md bg-surface-2/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
