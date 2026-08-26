"use client";

import * as React from "react";
import { HandHeart, X } from "lucide-react";

/**
 * The signature FIT BY YOU moment.
 *
 * A customer walks in after a year away, the tailor opens their profile, and
 * instead of an awkward "remind me?" the screen already knows who they are and
 * what was made for them last time. Dismissible, because after the first read
 * it would only be in the way.
 */
export function WelcomeBack({
  name,
  sentence,
}: {
  name: string;
  sentence: string;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-xl bg-ink-950 px-5 py-5 text-ivory-100 sm:px-6"
      style={{ animation: "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* A single warm highlight so the moment feels celebratory, not alarming */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-champagne-500/12 blur-2xl"
      />

      <div className="relative flex items-start gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-champagne-500/15">
          <HandHeart className="size-[1.125rem] text-champagne-300" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="display text-xl sm:text-2xl">Welcome back, {name}.</p>
          <p className="mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-ivory-100/70">
            {sentence}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="-mt-1 -mr-1 shrink-0 rounded-md p-1.5 text-ivory-100/45 transition-colors hover:bg-white/8 hover:text-ivory-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
