"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const Menu = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;
export const MenuGroup = DropdownMenuPrimitive.Group;

export const MenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function MenuContent({ className, sideOffset = 6, align = "end", ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-52 overflow-hidden rounded-lg border border-border bg-elevated p-1.5 shadow-lg",
          className,
        )}
        style={{ animation: "slide-down 0.16s cubic-bezier(0.16, 1, 0.3, 1)" }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

export const MenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    tone?: "default" | "danger";
  }
>(function MenuItem({ className, tone = "default", ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none",
        "transition-colors data-[highlighted]:bg-surface-muted",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-subtle-foreground",
        tone === "danger"
          ? "text-critical data-[highlighted]:bg-critical-soft [&_svg]:text-critical"
          : "text-foreground",
        className,
      )}
      {...props}
    />
  );
});

export const MenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(function MenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md py-2 pr-2.5 pl-8 text-sm outline-none select-none",
        "transition-colors data-[highlighted]:bg-surface-muted",
        className,
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-2.5">
        <Check className="size-3.5" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export function MenuSeparator({ className }: { className?: string }) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1.5 my-1.5 h-px bg-border", className)}
    />
  );
}

export function MenuLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("eyebrow px-2.5 py-2 text-subtle-foreground", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={300}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-64 rounded-md bg-ink-950 px-2.5 py-1.5 text-xs leading-relaxed text-ivory-100 shadow-lg dark:bg-ink-800"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-ink-950 dark:fill-ink-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
