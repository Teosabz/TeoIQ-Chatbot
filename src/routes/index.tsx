import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, ShieldCheck, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TeoIQ — Free AI Analysis for MT4 & MT5 Charts" },
      {
        name: "description",
        content:
          "TeoIQ turns a MetaTrader chart screenshot into an institutional AI trade plan: bias, entry, stop loss, take profit, risk:reward and confidence. No sign-up required.",
      },
      { property: "og:title", content: "TeoIQ — Free AI Analysis for MT4 & MT5 Charts" },
      {
        property: "og:description",
        content:
          "Upload a MetaTrader screenshot and get an ICT & Smart Money Concepts trade plan in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "Institutional AI", text: "ICT, SMC, Wyckoff and liquidity read on every chart." },
  { icon: Zap, title: "Seconds, not hours", text: "Bias, entry, stop loss, take profit and risk:reward instantly." },
  { icon: ShieldCheck, title: "Free & instant", text: "No sign-up, no passwords. Just upload a chart and go." },
];

function Landing() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-4 py-14 sm:px-6">
      <section className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <LineChart className="size-7" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          TeoIQ — AI trade plans from your MetaTrader charts
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Upload an MT4 or MT5 screenshot and get bias, entry, stop loss, take profit, risk:reward
          and a professional trade summary — free.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get started
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="panel rounded-2xl p-5">
            <Icon className="size-5 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-base font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-muted-foreground">
        TeoIQ · Educational use only. Not financial advice.
      </footer>
    </main>
  );
}
