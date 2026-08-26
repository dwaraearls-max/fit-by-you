"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-ink-950/45 backdrop-blur-[2px]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      style={{ animation: "fade-in 0.2s ease-out" }}
    />
  );
}

/**
 * On phones the dialog becomes a bottom sheet: a tailor holding a phone in one
 * hand should reach the primary action with a thumb, not stretch to the middle
 * of the screen.
 */
export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl";
    hideClose?: boolean;
  }
>(function DialogContent(
  { className, children, size = "md", hideClose = false, ...props },
  ref,
) {
  const widths = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col border border-border bg-surface shadow-xl",
          // Phone: bottom sheet
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl",
          // Tablet and up: centred panel
          "sm:top-1/2 sm:left-1/2 sm:inset-x-auto sm:bottom-auto sm:max-h-[88dvh] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
          widths[size],
          className,
        )}
        style={{ animation: "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        {...props}
      >
        {/* Drag affordance, phones only */}
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border-strong sm:hidden"
        />
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 hidden rounded-md p-1.5 text-subtle-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:block"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pr-12", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base leading-tight font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1.5 text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("scroll-elegant min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-4",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The common case, assembled: a controlled dialog with a title, an optional
 * description and a scrolling body. Reach for the parts above only when a
 * dialog needs a sticky footer or an unusual layout.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
