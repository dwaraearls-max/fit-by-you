"use client";

import * as React from "react";
import {
  Check,
  Ban,
  Loader2,
  Package,
  Ruler,
  Scissors,
  Shirt,
  Sparkles,
  Truck,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  labelFor,
  orderStatusIndex,
  toneFor,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import { updateOrderStatusAction } from "@/server/order-actions";

const STAGE_ICON = {
  NEW: Package,
  MEASURING: Ruler,
  CUTTING: Scissors,
  SEWING: Shirt,
  FITTING: Wand2,
  ADJUSTMENTS: Sparkles,
  READY: Check,
  DELIVERED: Truck,
} as const;

/**
 * The nine-stage tracker.
 *
 * A tailor should be able to see where an outfit is from across the room, and
 * advance it with one tap. Each stage is a submit button rather than a menu,
 * because tapping the stage you are now at is the whole interaction.
 */
export function StatusTracker({
  orderId,
  status,
  canEdit,
}: {
  orderId: string;
  status: string;
  canEdit: boolean;
}) {
  const [pendingStage, setPendingStage] = React.useState<string | null>(null);
  const currentIndex = orderStatusIndex(status);
  const cancelled = status === "CANCELLED";

  React.useEffect(() => {
    setPendingStage(null);
  }, [status]);

  if (cancelled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-critical/30 bg-critical-soft px-5 py-4">
        <Ban className="size-4 shrink-0 text-critical" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-critical">
            This order was cancelled
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            It stays on the customer&apos;s record, but no longer counts as work
            in progress.
          </p>
        </div>
        {canEdit ? (
          <form action={updateOrderStatusAction} className="ml-auto">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="status" value="SEWING" />
            <input
              type="hidden"
              name="note"
              value="Order reopened and put back into production."
            />
            <Button type="submit" variant="outline" size="sm">
              Reopen order
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-subtle-foreground">Progress</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {currentIndex >= ORDER_STATUS_FLOW.length - 1
              ? "Another perfect fit completed."
              : canEdit
                ? "Tap a stage to move this outfit along."
                : "Where this outfit is right now."}
          </p>
        </div>
        <Badge tone={toneFor(ORDER_STATUS_META, status)}>
          {labelFor(ORDER_STATUS_META, status)}
        </Badge>
      </div>

      <ol className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-8">
        {ORDER_STATUS_FLOW.map((stage, index) => {
          const Icon = STAGE_ICON[stage];
          const done = index < currentIndex;
          const current = index === currentIndex;
          const isPending = pendingStage === stage;

          const dot = (
            <span
              className={cn(
                "relative flex size-9 items-center justify-center rounded-full border transition-all duration-200",
                done && "border-transparent bg-ink-900 text-ivory-100",
                current &&
                  "border-transparent bg-accent text-accent-foreground ring-4 ring-accent/18",
                !done && !current && "border-border bg-surface text-subtle-foreground",
                canEdit && !current && "group-hover:border-ink-400 group-hover:text-foreground",
              )}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Icon className="size-4" aria-hidden />
              )}
            </span>
          );

          const label = (
            <span
              className={cn(
                "mt-2 block text-center text-[0.6875rem] leading-tight font-medium",
                current
                  ? "text-foreground"
                  : done
                    ? "text-muted-foreground"
                    : "text-subtle-foreground",
              )}
            >
              {labelFor(ORDER_STATUS_META, stage)}
            </span>
          );

          return (
            <li key={stage} className="relative">
              {/* Connector, drawn behind the dots on wide screens only */}
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[1.125rem] right-1/2 left-[-50%] hidden h-px sm:block",
                    index <= currentIndex ? "bg-ink-300" : "bg-border",
                  )}
                />
              ) : null}

              {canEdit && !current ? (
                <form
                  action={updateOrderStatusAction}
                  onSubmit={() => setPendingStage(stage)}
                  className="group relative flex flex-col items-center"
                >
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="status" value={stage} />
                  <button
                    type="submit"
                    className="flex cursor-pointer flex-col items-center rounded-lg px-1 py-1 transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label={`Move to ${labelFor(ORDER_STATUS_META, stage)}`}
                  >
                    {dot}
                    {label}
                  </button>
                </form>
              ) : (
                <div className="relative flex flex-col items-center px-1 py-1">
                  {dot}
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {canEdit && status !== "DELIVERED" ? (
        <form
          action={updateOrderStatusAction}
          className="mt-6 flex justify-end border-t border-border pt-4"
        >
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="CANCELLED" />
          <Button type="submit" variant="ghost" size="xs">
            <Ban />
            Cancel this order
          </Button>
        </form>
      ) : null}
    </div>
  );
}
