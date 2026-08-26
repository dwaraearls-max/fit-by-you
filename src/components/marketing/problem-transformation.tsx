"use client";

import * as React from "react";
import {
  ArrowDown,
  Calculator,
  Check,
  HelpCircle,
  Images,
  MessageCircle,
  Notebook,
  Search,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

const SCATTERED = [
  { icon: Notebook, label: "Notebook", detail: "Waist… somewhere on page 40" },
  { icon: MessageCircle, label: "WhatsApp", detail: "“Madam, remind me your hip?”" },
  { icon: Images, label: "Phone gallery", detail: "4,812 photos, no names" },
  { icon: Calculator, label: "Calculator", detail: "Did she pay the balance?" },
  { icon: HelpCircle, label: "Memory", detail: "It was… a slim fit? I think" },
];

const ORGANISED = [
  "One profile per customer",
  "Every measurement, dated",
  "Every order, tracked",
  "Every cedi, accounted for",
  "Everything searchable",
];

/**
 * The transformation. The scattered column dims and the organised column
 * assembles as the section enters view, so the argument is made visually
 * before a word of it is read.
 */
export function ProblemTransformation() {
  const [entered, setEntered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid items-start gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
      {/* Before */}
      <div>
        <p className="eyebrow text-subtle-foreground">Today</p>
        <div className="mt-5 space-y-2.5">
          {SCATTERED.map((item, index) => (
            <div
              key={item.label}
              style={{ transitionDelay: `${index * 70}ms` }}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-all duration-700",
                entered ? "translate-x-0 opacity-45 grayscale" : "opacity-100",
              )}
            >
              <item.icon
                className="mt-px size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Five places to look, and the answer is in none of them.
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center lg:pt-24">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full border border-accent-border bg-accent-soft transition-all duration-700",
            entered ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
          style={{ transitionDelay: "350ms" }}
        >
          <ArrowDown
            className="size-4 text-champagne-700 lg:-rotate-90 dark:text-champagne-300"
            aria-hidden
          />
        </span>
      </div>

      {/* After */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          <p className="eyebrow text-champagne-700 dark:text-champagne-300">
            With Fit By You
          </p>
        </div>

        <div
          className={cn(
            "mt-5 overflow-hidden rounded-xl border bg-surface transition-all duration-700",
            entered
              ? "translate-y-0 border-ink-950/15 opacity-100 shadow-lg"
              : "translate-y-4 border-border opacity-0",
          )}
          style={{ transitionDelay: "450ms" }}
        >
          <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-4 py-2.5">
            <Search className="size-3 text-subtle-foreground" aria-hidden />
            <span className="text-xs text-muted-foreground">Amanda</span>
          </div>

          <div className="divide-y divide-border">
            {ORGANISED.map((item, index) => (
              <div
                key={item}
                style={{ transitionDelay: `${600 + index * 90}ms` }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 transition-all duration-500",
                  entered ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              >
                <Check className="size-4 shrink-0 text-positive" aria-hidden />
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Reveal delay={200}>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            One place to look, and the answer is already there.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
