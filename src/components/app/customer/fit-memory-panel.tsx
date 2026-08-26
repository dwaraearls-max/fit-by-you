import { Sparkles, StickyNote } from "lucide-react";

import type { FitMemory } from "@/lib/fit-memory";

/**
 * The FIT MEMORY panel. Everything in it is derived from the business's own
 * rows, which is why it can be shown instantly and is never wrong.
 */
export function FitMemoryPanel({ memory }: { memory: FitMemory }) {
  return (
    <section className="overflow-hidden rounded-xl border border-accent-border bg-gradient-to-br from-accent-soft to-surface shadow-xs">
      <div className="flex items-center gap-2 border-b border-accent-border/70 px-5 py-3.5 sm:px-6">
        <Sparkles className="size-3.5 text-champagne-600" aria-hidden />
        <h2 className="eyebrow text-champagne-700 dark:text-champagne-300">
          Fit Memory
        </h2>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <p className="display text-xl text-foreground sm:text-2xl">
          {memory.headline}
        </p>

        {memory.narrative.length > 0 ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {memory.narrative.join(" ")}
          </p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {memory.facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="eyebrow text-subtle-foreground">{fact.label}</dt>
              <dd className="mt-1.5 truncate text-sm font-medium text-foreground">
                {fact.value}
              </dd>
              {fact.hint ? (
                <dd className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                  {fact.hint}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>

        {memory.notes ? (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-border bg-surface/70 px-3.5 py-3">
            <StickyNote className="mt-px size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
            <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
              {memory.notes}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
