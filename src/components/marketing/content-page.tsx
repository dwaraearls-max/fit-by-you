import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shared shell for the secondary marketing pages so they all share the same
 * rhythm without each one re-deriving its own layout.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  cta = true,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  cta?: boolean;
}) {
  return (
    <>
      <header className="relative overflow-hidden px-5 pt-16 pb-16 sm:px-8 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-96 opacity-[0.11]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 30%, var(--champagne-400) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="eyebrow text-champagne-400">{eyebrow}</p>
          <h1 className="display mt-5 text-[2.5rem] leading-[1.05] text-ivory-100 sm:text-5xl">
            {title}
          </h1>
          {intro ? (
            <p className="mt-6 text-base leading-relaxed text-ivory-100/60 sm:text-lg">
              {intro}
            </p>
          ) : null}
        </div>
      </header>

      <div className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>

      {cta ? (
        <section className="bg-surface-muted/40 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="display text-[1.75rem] leading-tight sm:text-[2rem]">
              Give your fashion business a memory.
            </h2>
            <p className="mt-3.5 text-sm text-muted-foreground">
              Free to start. No card required.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/signup">
                Start free
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Long-form prose block with the typographic rules the brand uses. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "space-y-6 text-[0.9375rem] leading-relaxed text-muted-foreground",
        "[&_h2]:display [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:text-foreground",
        "[&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground",
        "[&_p]:leading-relaxed",
        "[&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-champagne-400",
        "[&_ol]:space-y-2.5 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:marker:text-champagne-400",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
