import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Every app page opens the same way: what you are looking at, one line of
 * orientation, and the actions that belong to it on the right.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  eyebrow?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 sm:mb-8", className)}>
      {back ? (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="eyebrow mb-1.5 text-subtle-foreground">{eyebrow}</p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
