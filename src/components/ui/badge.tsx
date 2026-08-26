import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/domain";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-surface-muted text-muted-foreground",
        accent: "border-accent-border bg-accent-soft text-champagne-700 dark:text-champagne-300",
        positive: "border-transparent bg-positive-soft text-positive",
        caution: "border-transparent bg-caution-soft text-caution",
        critical: "border-transparent bg-critical-soft text-critical",
        info: "border-transparent bg-info-soft text-info",
        outline: "border-border-strong bg-transparent text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, "tone"> {
  tone?: Tone | "outline";
}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/** A small filled circle in the tone colour, for calendar and status lists. */
export function Dot({ tone = "neutral", className }: { tone?: Tone; className?: string }) {
  const map: Record<Tone, string> = {
    neutral: "bg-ink-300",
    accent: "bg-accent",
    positive: "bg-positive",
    caution: "bg-caution",
    critical: "bg-critical",
    info: "bg-info",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rounded-full", map[tone], className)}
    />
  );
}
