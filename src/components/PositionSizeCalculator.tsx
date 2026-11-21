import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { calculatePosition } from "@/lib/position";
import type { Analysis } from "@/lib/analysis";

/** Position size calculator driven by the analysis' entry / stop / target. */
export function PositionSizeCalculator({ analysis }: { analysis: Analysis }) {
  const [balance, setBalance] = useState("1000");
  const [risk, setRisk] = useState("1");

  const result = useMemo(
    () =>
      calculatePosition({
        balance: Number(balance) || 0,
        riskPercent: Number(risk) || 0,
        entry: analysis.entry_low != null && analysis.entry_high != null
          ? (analysis.entry_low + analysis.entry_high) / 2
          : null,
        sl: analysis.sl_value ?? null,
        tp: analysis.tp_value ?? null,
        pair: analysis.pair,
      }),
    [balance, risk, analysis],
  );

  return (
    <div className="glass rounded-xl p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Calculator className="size-3.5" aria-hidden />
        Position Size Calculator
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Account Balance ($)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="rounded-lg border border-border bg-surface-2/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Risk per Trade (%)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="rounded-lg border border-border bg-surface-2/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>

      {result.valid ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { label: "Lot Size", value: result.lots.toFixed(2), tone: "text-primary" },
              { label: "Dollar Risk", value: `$${result.dollarRisk.toFixed(2)}`, tone: "text-destructive" },
              { label: "Potential Profit", value: `$${result.potentialProfit.toFixed(2)}`, tone: "text-success" },
            ].map((c) => (
              <div key={c.label} className="rounded-lg bg-surface-2/60 px-2.5 py-2 text-center">
                <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{c.label}</p>
                <p className={`font-mono text-sm font-semibold ${c.tone}`}>{c.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {result.note} Approximate sizing for a USD account — verify with your broker's contract specs.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">{result.note}</p>
      )}
    </div>
  );
}
