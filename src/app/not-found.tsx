import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-24">
      <div className="max-w-md text-center">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
          404
        </p>
        <h1 className="mt-4 font-serif text-3xl leading-tight font-semibold tracking-tight">
          This page has been let out.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The link may be old, or the page may have moved. Either way, nothing in
          your business has changed.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Button asChild variant="primary" size="sm">
            <Link href="/">Back to the home page</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app">Go to my dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
