"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  // Authorisation failures are a normal part of a shared account, not a crash,
  // so they get a calmer explanation than an unexpected fault.
  const forbidden = error.name === "ForbiddenError";

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-muted">
        <TriangleAlert className="size-5 text-muted-foreground" aria-hidden />
      </span>

      <h1 className="mt-5 text-lg font-semibold tracking-tight">
        {forbidden ? "You don't have access to that" : "Something went wrong"}
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {forbidden
          ? error.message
          : "Nothing was lost. Your customers, measurements and orders are all still saved."}
      </p>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        {forbidden ? null : (
          <Button onClick={reset} variant="primary" size="sm">
            <RotateCcw />
            Try again
          </Button>
        )}
        <Button asChild variant={forbidden ? "primary" : "outline"} size="sm">
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
