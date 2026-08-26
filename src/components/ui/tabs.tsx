"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Tabs are URL-driven rather than client state. The customer profile's seven
 * tabs are therefore linkable, shareable, back-button friendly, and each one
 * renders on the server without shipping the other six.
 */
export function TabBar({
  tabs,
  param = "tab",
  className,
}: {
  tabs: { value: string; label: string; count?: number | null }[];
  param?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? tabs[0]?.value ?? "";

  return (
    <div
      className={cn(
        "no-scrollbar -mb-px flex items-end gap-1 overflow-x-auto border-b border-border",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.value === tabs[0]?.value) params.delete(param);
        else params.set(param, tab.value);
        const query = params.toString();
        const isActive = active === tab.value;

        return (
          <Link
            key={tab.value}
            href={query ? `${pathname}?${query}` : pathname}
            scroll={false}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative shrink-0 px-3.5 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "tabular ml-1.5 rounded-full px-1.5 py-0.5 text-[0.6875rem]",
                  isActive
                    ? "bg-ink-950 text-ivory-100"
                    : "bg-surface-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            ) : null}
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-ink-950 dark:bg-accent"
              />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

/** Segmented control used for filters and view switches. */
export function SegmentedLinks({
  options,
  param,
  className,
}: {
  options: { value: string; label: string }[];
  param: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? options[0]?.value ?? "";

  return (
    <div
      className={cn(
        "no-scrollbar inline-flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface-muted/60 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const params = new URLSearchParams(searchParams.toString());
        if (option.value === options[0]?.value) params.delete(param);
        else params.set(param, option.value);
        params.delete("page");
        const query = params.toString();
        const isActive = active === option.value;

        return (
          <Link
            key={option.value}
            href={query ? `${pathname}?${query}` : pathname}
            scroll={false}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
