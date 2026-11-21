import { Link } from "@tanstack/react-router";
import { BookOpenCheck, LayoutDashboard, LineChart } from "lucide-react";


export function AppHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <LineChart className="size-6" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            TeoChart Bot FREE
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload MT4 / MT5 Chart · 100% Free AI Analysis
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {(
          <nav className="flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground [&.active]:border-primary/40 [&.active]:bg-primary/10 [&.active]:text-primary"
            >
              <LayoutDashboard className="size-3.5" aria-hidden />
              Analyze
            </Link>
            <Link
              to="/journal"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground [&.active]:border-primary/40 [&.active]:bg-primary/10 [&.active]:text-primary"
            >
              <BookOpenCheck className="size-3.5" aria-hidden />
              Journal
            </Link>
          </nav>
        )}

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-success uppercase">
          <span className="relative flex size-2">

            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Gemini Free
        </span>

      </div>
    </header>
  );
}

