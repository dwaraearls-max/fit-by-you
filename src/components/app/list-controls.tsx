"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * URL-backed list controls.
 *
 * Search, filters, sort and page all live in the query string, so a filtered
 * view is a link a tailor can bookmark or send to their staff, and every list
 * still renders on the server.
 */

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Any change to what is being looked at resets the page.
      if (!("page" in updates)) params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}

export function SearchField({
  placeholder = "Search…",
  param = "q",
  className,
  autoFocus = false,
}: {
  placeholder?: string;
  param?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const searchParams = useSearchParams();
  const update = useQueryUpdater();
  const initial = searchParams.get(param) ?? "";
  const [value, setValue] = React.useState(initial);
  const dirty = React.useRef(false);

  // Follow the URL when it changes underneath us (back button, filter chip),
  // but never fight the user mid-keystroke.
  React.useEffect(() => {
    if (!dirty.current) setValue(initial);
  }, [initial]);

  React.useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => {
      update({ [param]: value.trim() || null });
      dirty.current = false;
    }, 220);
    return () => clearTimeout(timer);
  }, [value, param, update]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => {
          dirty.current = true;
          setValue(event.target.value);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-surface pr-9 pl-10 text-sm text-foreground transition-colors placeholder:text-subtle-foreground hover:border-border-strong focus:border-border-strong focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            dirty.current = true;
            setValue("");
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-subtle-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function FilterChips({
  options,
  param = "filter",
  className,
}: {
  options: { value: string; label: string; count?: number }[];
  param?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? options[0]?.value ?? "";

  return (
    <div
      className={cn(
        "no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5",
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
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-all",
              isActive
                ? "border-ink-950 bg-ink-950 text-ivory-100"
                : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "tabular text-[0.6875rem]",
                  isActive ? "text-ivory-100/65" : "text-subtle-foreground",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function SortSelect({
  options,
  param = "sort",
  className,
}: {
  options: { value: string; label: string }[];
  param?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const update = useQueryUpdater();
  const active = searchParams.get(param) ?? options[0]?.value ?? "";

  return (
    <select
      value={active}
      onChange={(event) =>
        update({
          [param]:
            event.target.value === options[0]?.value ? null : event.target.value,
        })
      }
      aria-label="Sort"
      className={cn(
        "h-10 shrink-0 rounded-lg border border-border bg-surface px-3 text-[0.8125rem] font-medium text-foreground transition-colors hover:border-border-strong focus:outline-none",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
