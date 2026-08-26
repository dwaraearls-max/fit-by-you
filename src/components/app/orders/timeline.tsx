import {
  Ban,
  Camera,
  CheckCircle2,
  CircleDot,
  FileText,
  Package,
  Ruler,
  Scissors,
  Truck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatFriendlyDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

const EVENT_ICON: Record<string, LucideIcon> = {
  CREATED: Package,
  STATUS_CHANGED: CircleDot,
  MEASUREMENT_TAKEN: Ruler,
  FABRIC_RECEIVED: Scissors,
  FITTING_SCHEDULED: CircleDot,
  FITTING_COMPLETED: CheckCircle2,
  PAYMENT_RECORDED: Wallet,
  PHOTO_ADDED: Camera,
  NOTE_ADDED: FileText,
  DELIVERED: Truck,
  CANCELLED: Ban,
};

const EVENT_TINT: Record<string, string> = {
  PAYMENT_RECORDED: "text-positive",
  DELIVERED: "text-positive",
  CANCELLED: "text-critical",
  FITTING_COMPLETED: "text-info",
};

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: Date;
  actorName: string | null;
};

/**
 * The order's history. Read top-down it answers "what has happened to this
 * outfit and who did it", which is the question a customer asks on the phone.
 */
export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const Icon = EVENT_ICON[event.type] ?? CircleDot;
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-border"
              />
            ) : null}

            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
              <Icon
                className={cn(
                  "size-3.5",
                  EVENT_TINT[event.type] ?? "text-muted-foreground",
                )}
                aria-hidden
              />
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[0.8125rem] font-medium text-foreground">
                {event.title}
              </p>
              {event.description ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
              <p className="mt-1.5 text-[0.6875rem] text-subtle-foreground">
                {formatFriendlyDateTime(event.occurredAt)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
