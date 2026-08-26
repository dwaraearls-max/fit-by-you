import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Large customer databases are paginated on the server. The component takes a
 * ready-made href builder so it works on any list without knowing its filters.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  buildHref,
  label = "records",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  buildHref: (page: number) => string;
  label?: string;
}) {
  if (pageCount <= 1) {
    return total > 0 ? (
      <p className="px-1 py-3 text-xs text-muted-foreground">
        <span className="tabular">{total}</span> {label}
      </p>
    ) : null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 py-3"
    >
      <p className="text-xs text-muted-foreground">
        Showing <span className="tabular font-medium text-foreground">{from}–{to}</span>{" "}
        of <span className="tabular font-medium text-foreground">{total}</span> {label}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </PageLink>
        {pageWindow(page, pageCount).map((entry, index) =>
          entry === null ? (
            <span key={`gap-${index}`} className="px-1.5 text-sm text-subtle-foreground">
              …
            </span>
          ) : (
            <PageLink
              key={entry}
              href={buildHref(entry)}
              active={entry === page}
              aria-label={`Page ${entry}`}
            >
              <span className="tabular">{entry}</span>
            </PageLink>
          ),
        )}
        <PageLink
          href={buildHref(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  active,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  const classes = cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[0.8125rem] font-medium transition-colors",
    active
      ? "bg-ink-950 text-ivory-100"
      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={classes} aria-disabled {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} scroll={false} className={classes} {...props}>
      {children}
    </Link>
  );
}

/** 1 … 4 5 6 … 20 */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < pageCount) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let previous = 0;

  for (const value of sorted) {
    if (previous && value - previous > 1) out.push(null);
    out.push(value);
    previous = value;
  }

  return out;
}
