import { Check, Minus } from "lucide-react";
import type { ChecklistItem } from "@/lib/analysis";

export function TradeChecklist({ items }: { items: ChecklistItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="glass rounded-xl p-4">
      <p className="mb-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Trading Checklist
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.name}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
              item.status ? "bg-success/10 text-foreground" : "bg-surface-2/50 text-muted-foreground"
            }`}
          >
            <span
              className={`flex size-4.5 shrink-0 items-center justify-center rounded-full ${
                item.status ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {item.status ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Minus className="size-3" aria-hidden />
              )}
            </span>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
