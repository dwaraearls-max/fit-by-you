import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/domain";

/**
 * The headline number cards. Deliberately typographic rather than colourful —
 * the value is the hero, everything else recedes.
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "neutral",
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: { value: number; label?: string; unit?: DeltaUnit } | null;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  className?: string;
}) {
  const accentBar: Record<Tone, string> = {
    neutral: "bg-ink-200",
    accent: "bg-accent",
    positive: "bg-positive",
    caution: "bg-caution",
    critical: "bg-critical",
    info: "bg-info",
  };

  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute top-5 left-0 h-6 w-[3px] rounded-r-full transition-all duration-200 group-hover:h-8",
          accentBar[tone],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-subtle-foreground">{label}</p>
        {Icon ? (
          <Icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
        ) : href ? (
          <ArrowUpRight className="size-4 shrink-0 text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        ) : null}
      </div>
      <p className="tabular mt-3.5 text-[1.75rem] leading-none font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {delta || hint ? (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {delta ? (
            <DeltaPill value={delta.value} label={delta.label} unit={delta.unit} />
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </>
  );

  const classes = cn(
    "group relative overflow-hidden rounded-xl border border-border bg-surface px-5 py-5 shadow-xs transition-all duration-200",
    href && "hover:border-border-strong hover:shadow-md",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}

/** Percentages suit money; plain counts suit customers and finished outfits. */
export type DeltaUnit = "percent" | "count";

export function DeltaPill({
  value,
  label,
  unit = "percent",
}: {
  value: number;
  label?: string;
  unit?: DeltaUnit;
}) {
  if (value === 0) {
    return (
      <span className="text-muted-foreground">
        No change{label ? ` ${label}` : ""}
      </span>
    );
  }

  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        up ? "text-positive" : "text-critical",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span className="tabular">
        {up ? "+" : ""}
        {value}
        {unit === "percent" ? "%" : ""}
      </span>
      {label ? <span className="font-normal text-muted-foreground">{label}</span> : null}
    </span>
  );
}

/** Label/value pair used all over profiles, orders and receipts. */
export function DataPoint({
  label,
  value,
  className,
  emphasis = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="eyebrow text-subtle-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1.5 truncate text-foreground",
          emphasis ? "tabular text-lg font-semibold" : "text-sm font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
