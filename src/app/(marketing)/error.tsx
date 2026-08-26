"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          This page stumbled.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing in your business was touched. Try again, or go back to the
          home page.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Button onClick={reset} variant="primary" size="sm">
            <RotateCcw />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
