import * as React from "react";

import { cn, hashToIndex, initials } from "@/lib/utils";

/**
 * Deterministic tints so a given customer always keeps the same avatar colour.
 * Muted on purpose — a wall of bright circles would fight the interface.
 */
const TINTS = [
  "bg-champagne-100 text-champagne-800",
  "bg-ivory-300 text-ink-700",
  "bg-info-soft text-info",
  "bg-positive-soft text-positive",
  "bg-caution-soft text-caution",
  "bg-ink-100 text-ink-600",
] as const;

const SIZES = {
  xs: "size-6 text-[0.5625rem]",
  sm: "size-8 text-[0.6875rem]",
  md: "size-10 text-xs",
  lg: "size-14 text-sm",
  xl: "size-20 text-lg",
  "2xl": "size-28 text-2xl",
} as const;

export type AvatarSize = keyof typeof SIZES;

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
}) {
  const tint = TINTS[hashToIndex(name, TINTS.length)] ?? TINTS[0];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold tracking-wide select-none",
        SIZES[size],
        src ? "bg-surface-muted" : tint,
        ring && "ring-2 ring-surface ring-offset-1 ring-offset-border",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}

/** Overlapping avatars for "recent customers" style summaries. */
export function AvatarStack({
  people,
  max = 4,
  size = "sm",
}: {
  people: { name: string; src?: string | null }[];
  max?: number;
  size?: AvatarSize;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          src={person.src}
          size={size}
          ring
          className={index > 0 ? "-ml-2" : undefined}
        />
      ))}
      {extra > 0 ? (
        <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-surface-muted text-[0.6875rem] font-semibold text-muted-foreground ring-2 ring-surface">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
