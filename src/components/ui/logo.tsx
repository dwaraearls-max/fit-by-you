import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The mark is a needle with a thread looping through its eye — the thread
 * doubles as the "memory" the brand promise leans on.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-ink-950" />
      {/* Needle */}
      <path
        d="M11 24.5 21.5 9"
        stroke="currentColor"
        className="text-champagne-400"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Eye of the needle */}
      <ellipse
        cx="20.1"
        cy="11.2"
        rx="1.5"
        ry="2.3"
        transform="rotate(34 20.1 11.2)"
        stroke="currentColor"
        className="text-champagne-400"
        strokeWidth="1.15"
      />
      {/* Thread looping back — the memory */}
      <path
        d="M19.2 13.4c-3.4 1.3-5.1 3.4-4 5.2 1.2 1.9 4.5 1.4 6-.4 1.6-1.9.4-4.2-2-4.6"
        stroke="currentColor"
        className="text-ivory-100"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  inverted = false,
}: {
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark ? (
        <span
          className={cn(
            "text-[0.9375rem] leading-none font-semibold tracking-[0.14em] uppercase",
            inverted ? "text-ivory-100" : "text-foreground",
          )}
        >
          Fit By You
        </span>
      ) : null}
    </span>
  );
}

/** The brand promise, used in the footer and on auth screens. */
export function Tagline({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <p
      className={cn(
        "display text-sm",
        inverted ? "text-ivory-100/70" : "text-muted-foreground",
        className,
      )}
    >
      Your Fashion Business Has a Memory.
    </p>
  );
}
