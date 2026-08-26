"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AuthError({
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
    <div className="text-center">
      <h1 className="text-lg font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sign-in is still safe. Your password was not changed. Try again, or go
        back to the home page.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2.5">
        <Button onClick={reset} variant="primary" size="sm">
          <RotateCcw />
          Try again
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
