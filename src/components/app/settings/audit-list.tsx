import Link from "next/link";
import { History } from "lucide-react";

import { formatDateTime, timeAgo } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export type AuditRow = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
};

/** Where a log line's subject still exists in the app, link straight to it. */
function hrefFor(row: AuditRow): string | null {
  if (!row.entityId) return null;
  switch (row.entityType) {
    case "Customer":
      return `/app/customers/${row.entityId}`;
    case "Order":
      return `/app/orders/${row.entityId}`;
    case "Payment":
      return `/app/payments/${row.entityId}`;
    default:
      return null;
  }
}

export function AuditList({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState
          icon={History}
          title="Nothing recorded yet."
          message="From now on, every change anyone on your team makes shows up here — who did it, what they did, and when."
        />
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 overflow-hidden rounded-xl border border-border bg-surface">
      {rows.map((row) => {
        const href = hrefFor(row);
        const body = (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] leading-snug text-foreground">
                {row.summary}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {row.actorName} · {formatDateTime(row.createdAt)}
              </span>
            </span>
            <span className="shrink-0 text-xs whitespace-nowrap text-subtle-foreground">
              {timeAgo(row.createdAt)}
            </span>
          </>
        );

        return (
          <li key={row.id} className="border-b border-border last:border-b-0">
            {href ? (
              <Link
                href={href}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
