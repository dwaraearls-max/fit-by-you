"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Plus, Search, ShoppingBag, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "@/components/ui/menu";
import { CommandPalette } from "@/components/app/command-palette";
import {
  NotificationCenter,
  type NotificationRow,
} from "@/components/app/notification-center";

export function Topbar({
  notifications,
  unreadCount,
  canCreate,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
  canCreate: boolean;
}) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [shortcut, setShortcut] = React.useState("Ctrl K");

  React.useEffect(() => {
    if (/mac|iphone|ipad/i.test(navigator.userAgent)) setShortcut("⌘K");
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-lg sm:px-6 lg:px-8 print:hidden">
        <Link href="/app" className="lg:hidden" aria-label="FIT BY YOU dashboard">
          <Logo />
        </Link>

        {/* Search: a real input on desktop, an icon on phones where the
            keyboard would eat the screen anyway. */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-lg border border-border bg-surface-muted/60 px-3.5 text-left transition-colors hover:border-border-strong hover:bg-surface-muted lg:mr-auto lg:ml-0 lg:flex"
        >
          <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
          <span className="flex-1 truncate text-sm text-subtle-foreground">
            Search customers, orders, measurements…
          </span>
          <kbd className="shrink-0 rounded border border-border-strong px-1.5 py-0.5 text-[0.625rem] font-medium text-subtle-foreground">
            {shortcut}
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground lg:hidden"
          >
            <Search className="size-[1.125rem]" aria-hidden />
          </button>

          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
          />

          {canCreate ? (
            <Menu>
              <MenuTrigger asChild>
                <Button size="sm" className="ml-2 hidden lg:inline-flex">
                  <Plus />
                  Create
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Add to your business</MenuLabel>
                <MenuItem asChild>
                  <Link href="/app/customers/new">
                    <UserPlus />
                    New customer
                  </Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link href="/app/orders/new">
                    <ShoppingBag />
                    New order
                  </Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link href="/app/payments/new">
                    <CreditCard />
                    Record a payment
                  </Link>
                </MenuItem>
              </MenuContent>
            </Menu>
          ) : null}
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
