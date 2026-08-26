"use client";

import * as React from "react";
import Link from "next/link";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Bell, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NOTIFICATION_TYPE_META, labelFor, toneFor } from "@/lib/domain";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { markNotificationsReadAction } from "@/server/notification-actions";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function hrefFor(notification: NotificationRow): string | null {
  if (!notification.entityId) return null;
  switch (notification.entityType) {
    case "order":
      return `/app/orders/${notification.entityId}`;
    case "customer":
      return `/app/customers/${notification.entityId}`;
    case "payment":
      return "/app/payments";
    default:
      return null;
  }
}

export function NotificationCenter({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Bell className="size-[1.125rem]" aria-hidden />
        {unreadCount > 0 ? (
          <span className="tabular absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[0.5625rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-elevated shadow-lg"
          style={{ animation: "slide-down 0.16s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold tracking-tight">Notifications</p>
            {unreadCount > 0 ? (
              <form action={markNotificationsReadAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CheckCheck className="size-3.5" aria-hidden />
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>

          <div className="scroll-elegant max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState
                compact
                icon={Bell}
                title="All quiet."
                message="New orders, payments and tomorrow's fittings will show up here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const href = hrefFor(notification);
                  const unread = !notification.readAt;

                  const body = (
                    <>
                      <div className="flex items-start justify-between gap-2.5">
                        <p
                          className={cn(
                            "text-[0.8125rem] leading-snug",
                            unread
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        {unread ? (
                          <span
                            aria-hidden
                            className="mt-1 size-1.5 shrink-0 rounded-full bg-accent"
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge tone={toneFor(NOTIFICATION_TYPE_META, notification.type)}>
                          {labelFor(NOTIFICATION_TYPE_META, notification.type)}
                        </Badge>
                        <span className="text-[0.6875rem] text-subtle-foreground">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </>
                  );

                  return (
                    <li key={notification.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="block px-4 py-3.5 transition-colors hover:bg-surface-muted/60"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="px-4 py-3.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
