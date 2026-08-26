"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Plus, Sparkles, UserCog } from "lucide-react";

import { Logo, LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { NAV_ITEMS, activeNavHref } from "@/lib/navigation";
import { ROLE_META, labelFor } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { signOutAction, switchBusinessAction } from "@/server/auth-actions";

export type ShellUser = {
  name: string;
  email: string;
  role: string;
};

export type ShellBusiness = {
  id: string;
  name: string;
  memberships: { id: string; name: string }[];
};

export function Sidebar({
  allowed,
  user,
  business,
  planName,
  planIsFree,
}: {
  /**
   * The hrefs this role may see. Only strings cross the server boundary, so the
   * icons stay here on the client where they are React components.
   */
  allowed: string[];
  user: ShellUser;
  business: ShellBusiness;
  planName: string;
  planIsFree: boolean;
}) {
  const pathname = usePathname();
  const active = activeNavHref(pathname);
  const items = NAV_ITEMS.filter((item) => allowed.includes(item.href));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex print:hidden">
      <div className="flex h-16 items-center px-5">
        <Link href="/app" aria-label="FIT BY YOU dashboard">
          <Logo />
        </Link>
      </div>

      {/* Business switcher */}
      <div className="px-3">
        <Menu>
          <MenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink-950">
              <LogoMark className="size-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] leading-tight font-semibold text-foreground">
                {business.name}
              </span>
              <span className="block truncate text-[0.6875rem] text-muted-foreground">
                {labelFor(ROLE_META, user.role)}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
          </MenuTrigger>

          <MenuContent align="start" className="w-56">
            <MenuLabel>Your businesses</MenuLabel>
            {business.memberships.map((entry) => (
              <form key={entry.id} action={switchBusinessAction}>
                <input type="hidden" name="businessId" value={entry.id} />
                <MenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    <span className="flex-1 truncate">{entry.name}</span>
                    {entry.id === business.id ? (
                      <span className="text-xs text-subtle-foreground">Current</span>
                    ) : null}
                  </button>
                </MenuItem>
              </form>
            ))}
            <MenuSeparator />
            <MenuItem asChild>
              <Link href="/app/settings">
                <UserCog />
                Business settings
              </Link>
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      <nav className="scroll-elegant mt-5 flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = active === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-medium transition-all duration-150",
                    isActive
                      ? "bg-ink-950 text-ivory-100 shadow-xs"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-[1.125rem] shrink-0 transition-transform duration-150",
                      !isActive && "group-hover:scale-105",
                    )}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Plan nudge — only when there is something to gain by upgrading */}
      {planIsFree ? (
        <div className="mx-3 mb-3 rounded-lg border border-accent-border bg-accent-soft p-3.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-champagne-600" aria-hidden />
            <p className="eyebrow text-champagne-700 dark:text-champagne-300">
              {planName}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Unlock analytics, WhatsApp tools and staff accounts.
          </p>
          <Button asChild size="xs" variant="primary" className="mt-3 w-full">
            <Link href="/app/settings?tab=billing">See plans</Link>
          </Button>
        </div>
      ) : null}

      {/* Account */}
      <div className="border-t border-border p-3">
        <Menu>
          <MenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Avatar name={user.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] leading-tight font-medium text-foreground">
                {user.name}
              </span>
              <span className="block truncate text-[0.6875rem] text-muted-foreground">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
          </MenuTrigger>

          <MenuContent align="start" className="w-56">
            <MenuItem asChild>
              <Link href="/app/settings?tab=account">
                <UserCog />
                Your account
              </Link>
            </MenuItem>
            <MenuItem asChild>
              <Link href="/app/customers/new">
                <Plus />
                New customer
              </Link>
            </MenuItem>
            <MenuSeparator />
            <form action={signOutAction}>
              <MenuItem asChild tone="danger">
                <button type="submit" className="w-full text-left">
                  <LogOut />
                  Sign out
                </button>
              </MenuItem>
            </form>
          </MenuContent>
        </Menu>
      </div>
    </aside>
  );
}
