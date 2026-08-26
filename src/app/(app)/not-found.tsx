import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-muted">
        <SearchX className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="mt-5 text-lg font-semibold tracking-tight">
        We couldn&apos;t find that
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        It may have been deleted, or it belongs to another business.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2.5">
        <Button asChild variant="primary" size="sm">
          <Link href="/app/customers">Browse customers</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
