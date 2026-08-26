"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MarketingNav({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page scrolling behind the open mobile sheet.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-18">
        <Link href="/" aria-label="FIT BY YOU home">
          <Logo inverted />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.8125rem] font-medium text-ivory-100/60 transition-colors hover:text-ivory-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {signedIn ? (
            <Button asChild variant="inverted" size="sm">
              <Link href="/app">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-ivory-100/70 hover:bg-white/10 hover:text-ivory-100">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="inverted" size="sm">
                <Link href="/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-2 rounded-md p-2 text-ivory-100 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open ? (
        <div
          className="border-t border-white/[0.07] bg-ink-950 px-5 pt-4 pb-8 md:hidden"
          style={{ animation: "slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-[0.9375rem] font-medium text-ivory-100/75 transition-colors hover:bg-white/5 hover:text-ivory-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            {signedIn ? (
              <Button asChild variant="inverted" size="lg">
                <Link href="/app">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="inverted" size="lg">
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button asChild variant="invertedOutline" size="lg">
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
