"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarDays,
  CreditCard,
  Loader2,
  Plus,
  Ruler,
  Search,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";

import type { SearchResult } from "@/app/api/search/route";
import { cn, initials } from "@/lib/utils";

const KIND_META: Record<
  SearchResult["kind"],
  { icon: typeof User; group: string }
> = {
  customer: { icon: User, group: "Customers" },
  order: { icon: ShoppingBag, group: "Orders" },
  measurement: { icon: Ruler, group: "Measurements" },
  balance: { icon: Wallet, group: "Outstanding balances" },
};

const QUICK_ACTIONS = [
  { label: "New customer", href: "/app/customers/new", icon: Plus },
  { label: "Take measurements", href: "/app/measurements", icon: Ruler },
  { label: "New order", href: "/app/orders/new", icon: ShoppingBag },
  { label: "Record a payment", href: "/app/payments/new", icon: CreditCard },
  { label: "Today's schedule", href: "/app/calendar", icon: CalendarDays },
] as const;

/**
 * Global search, opened with ⌘K or by tapping the search bar.
 *
 * Results are fetched from the server rather than filtered on the client — a
 * fashion house with 5,000 customers cannot ship its customer list to the
 * browser, and the brief asks for results "instantly, as you type".
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced fetch, aborting the previous request so results can never arrive
  // out of order and overwrite a newer query.
  React.useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 140);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const grouped = React.useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const result of results) {
      const group = KIND_META[result.kind].group;
      const list = map.get(group) ?? [];
      list.push(result);
      map.set(group, list);
    }
    return [...map.entries()];
  }, [results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-ink-950/45 backdrop-blur-[2px]"
        style={{ animation: "fade-in 0.15s ease-out" }}
      />

      <div
        className="absolute inset-x-3 top-[8vh] mx-auto max-w-xl sm:inset-x-6 sm:top-[12vh]"
        style={{ animation: "scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <Command
          shouldFilter={false}
          loop
          className="overflow-hidden rounded-xl border border-border bg-elevated shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            {loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-subtle-foreground" aria-hidden />
            ) : (
              <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
            )}
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search customers, orders, measurements…"
              className="h-14 w-full bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-subtle-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border-strong px-1.5 py-0.5 text-[0.625rem] font-medium text-subtle-foreground sm:block">
              ESC
            </kbd>
          </div>

          <Command.List className="scroll-elegant max-h-[min(24rem,60vh)] overflow-y-auto p-2">
            {query.trim().length >= 2 && !loading && results.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Nothing found for “{query.trim()}”
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Try a name, a phone number, an order number, or a measurement
                  like “32 waist”.
                </p>
              </div>
            ) : null}

            {query.trim().length < 2 ? (
              <Command.Group
                heading="Quick actions"
                className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-subtle-foreground"
              >
                {QUICK_ACTIONS.map((action) => (
                  <Command.Item
                    key={action.href}
                    value={action.label}
                    onSelect={() => go(action.href)}
                    className={itemClass}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                      <action.icon className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {grouped.map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-subtle-foreground"
              >
                {items.map((result) => {
                  const Icon = KIND_META[result.kind].icon;
                  return (
                    <Command.Item
                      key={result.id}
                      value={result.id}
                      onSelect={() => go(result.href)}
                      className={itemClass}
                    >
                      {result.kind === "customer" ? (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-champagne-100 text-[0.625rem] font-semibold text-champagne-800">
                          {initials(result.title)}
                        </span>
                      ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                          <Icon className="size-4 text-muted-foreground" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </span>
                      {result.meta ? (
                        <span className="tabular shrink-0 text-xs text-subtle-foreground">
                          {result.meta}
                        </span>
                      ) : null}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

const itemClass = cn(
  "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 outline-none select-none",
  "transition-colors data-[selected=true]:bg-surface-muted",
);
