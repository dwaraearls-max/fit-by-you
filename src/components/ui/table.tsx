import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A quiet table: hairline rules, no zebra striping, generous row height.
 * On phones these are replaced by card lists rather than being scrolled
 * sideways, so the table never needs a horizontal scrollbar.
 */
export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-border bg-surface-muted/40", className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-surface-muted/50", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  align,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "eyebrow px-4 py-3 font-medium text-subtle-foreground",
        align === "right" && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-foreground",
        align === "right" && "tabular text-right",
        className,
      )}
      {...props}
    />
  );
}

/** Wraps a table so its corners and border match the surrounding cards. */
export function TableShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
