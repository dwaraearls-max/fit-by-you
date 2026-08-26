"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Images,
  Menu as MenuIcon,
  Plus,
  Ruler,
  Settings,
  UserPlus,
  X,
} from "lucide-react";

import { NAV_ITEMS, activeNavHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * The phone shell is designed separately from the desktop one rather than being
 * a collapsed sidebar. Navigation sits at the bottom within thumb reach, the
 * five most-used destinations are always visible, and a floating action button
 * covers the three things a tailor starts at the counter.
 */

const FAB_ACTIONS = [
  {
    href: "/app/customers/new",
    label: "New customer",
    detail: "Name, phone and first measurements",
    icon: UserPlus,
  },
  {
    href: "/app/measurements",
    label: "Take measurements",
    detail: "Open a customer and record a new session",
    icon: Ruler,
  },
  {
    href: "/app/orders/new",
    label: "New order",
    detail: "Outfit, price and delivery date",
    icon: Plus,
  },
  {
    href: "/app/payments/new",
    label: "Record a payment",
    detail: "Cash, mobile money, transfer or card",
    icon: CreditCard,
  },
] as const;

const MORE_ITEMS: { href: string; label: string; icon: typeof Ruler }[] = [
  { href: "/app/measurements", label: "Measurements", icon: Ruler },
  { href: "/app/styles", label: "Style Library", icon: Images },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function MobileNav({ allowed }: { allowed: string[] }) {
  const items = NAV_ITEMS.filter((item) => allowed.includes(item.href));
  const pathname = usePathname();
  const active = activeNavHref(pathname);
  const [sheet, setSheet] = React.useState<"none" | "fab" | "more">("none");

  React.useEffect(() => {
    setSheet("none");
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = sheet === "none" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const bottomItems = items.filter((item) => item.mobile).slice(0, 4);
  const allowedMore = MORE_ITEMS.filter((entry) =>
    items.some((item) => item.href === entry.href),
  );

  return (
    <>
      {/* Backdrop + sheet */}
      {sheet !== "none" ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheet("none")}
            className="absolute inset-0 cursor-default bg-ink-950/45 backdrop-blur-[2px]"
            style={{ animation: "fade-in 0.15s ease-out" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-elevated pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ animation: "slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div
              aria-hidden
              className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-border-strong"
            />

            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-semibold tracking-tight">
                {sheet === "fab" ? "What are you doing?" : "More"}
              </p>
              <button
                type="button"
                onClick={() => setSheet("none")}
                aria-label="Close"
                className="rounded-md p-1.5 text-subtle-foreground hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-3 pb-3">
              {sheet === "fab"
                ? FAB_ACTIONS.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3.5 rounded-lg px-2.5 py-3.5 transition-colors active:bg-surface-muted"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-950">
                        <action.icon className="size-[1.125rem] text-ivory-100" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-medium text-foreground">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {action.detail}
                        </span>
                      </span>
                    </Link>
                  ))
                : allowedMore.map((entry) => (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      className="flex items-center gap-3.5 rounded-lg px-2.5 py-3.5 transition-colors active:bg-surface-muted"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                        <entry.icon className="size-[1.125rem] text-foreground" aria-hidden />
                      </span>
                      <span className="text-[0.9375rem] font-medium text-foreground">
                        {entry.label}
                      </span>
                    </Link>
                  ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setSheet("fab")}
        aria-label="Create"
        className={cn(
          "fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 lg:hidden print:hidden",
          "flex size-14 items-center justify-center rounded-full bg-ink-950 text-ivory-100 shadow-lg",
          "transition-transform duration-150 active:scale-95",
        )}
      >
        <Plus className="size-6" aria-hidden />
      </button>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden print:hidden">
        <ul className="grid grid-cols-5">
          {bottomItems.map((item) => {
            const isActive = active === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 px-1 py-2.5 transition-colors",
                    isActive ? "text-foreground" : "text-subtle-foreground",
                  )}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute top-0 h-[2px] w-8 rounded-full bg-ink-950 dark:bg-accent"
                    />
                  ) : null}
                  <item.icon className="size-[1.375rem]" aria-hidden />
                  <span className="text-[0.625rem] font-medium">
                    {item.shortLabel ?? item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setSheet("more")}
              className="flex w-full flex-col items-center gap-1 px-1 py-2.5 text-subtle-foreground"
            >
              <MenuIcon className="size-[1.375rem]" aria-hidden />
              <span className="text-[0.625rem] font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
