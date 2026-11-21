import type { LucideIcon } from "lucide-react";
import { isVisible } from "@/lib/analysis";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  mono?: boolean;
  accent?: "default" | "success" | "destructive" | "warning" | "primary";
}

const accents: Record<string, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
  primary: "text-primary",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  mono,
  accent = "default",
}: MetricCardProps) {
  const known = isVisible(value);
  return (
    <div className="group glass rounded-xl px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${accents[accent]}`} aria-hidden />
        <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p
        className={`mt-1.5 text-sm leading-snug font-semibold break-words ${mono ? "font-mono" : ""} ${
          known ? "" : "text-muted-foreground/70"
        }`}
      >
        {known ? value : "Not Visible"}
      </p>
    </div>
  );
}
