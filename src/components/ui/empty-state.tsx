import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * FIT BY YOU never shows a blank screen. Every empty state names what is
 * missing, says something human about it, and offers the one action that fixes
 * it — so the interface teaches itself.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-6 py-10" : "px-6 py-16 sm:py-20",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-5 inline-flex items-center justify-center rounded-full border border-accent-border bg-accent-soft p-3.5">
          <Icon className="size-5 text-champagne-700 dark:text-champagne-300" aria-hidden />
        </span>
      ) : null}
      <h3
        className={cn(
          "display text-foreground",
          compact ? "text-xl" : "text-2xl sm:text-[1.75rem]",
        )}
      >
        {title}
      </h3>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
