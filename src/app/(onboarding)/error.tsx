"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OnboardingError({
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
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-lg font-semibold tracking-tight">
        That step did not finish.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Nothing you already saved was lost. Try the step again, or go back to
        your dashboard if you have already started.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2.5">
        <Button onClick={reset} variant="primary" size="sm">
          <RotateCcw />
          Try again
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
