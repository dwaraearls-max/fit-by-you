import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-all duration-200 ease-out select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "active:scale-[0.985]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-ink-950 text-ivory-100 shadow-sm hover:bg-ink-800 hover:shadow-md dark:bg-ivory-100 dark:text-ink-950 dark:hover:bg-white",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:brightness-[1.07] hover:shadow-md",
        outline:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-muted hover:border-ink-300",
        subtle:
          "bg-surface-muted text-foreground hover:bg-ivory-300 dark:hover:bg-ink-700",
        ghost:
          "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline hover:text-accent",
        danger:
          "bg-critical text-white shadow-sm hover:brightness-110 hover:shadow-md",
        /** Used on the dark marketing hero. */
        inverted:
          "bg-ivory-100 text-ink-950 shadow-sm hover:bg-white hover:shadow-lg",
        invertedOutline:
          "border border-white/20 text-ivory-100 hover:bg-white/10 hover:border-white/35",
      },
      size: {
        xs: "h-7 rounded-sm px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 rounded-md px-3.5 text-[0.8125rem] [&_svg]:size-4",
        md: "h-10 rounded-md px-4 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-lg px-6 text-[0.9375rem] [&_svg]:size-[1.125rem]",
        xl: "h-14 rounded-lg px-8 text-base [&_svg]:size-5",
        icon: "size-10 rounded-md [&_svg]:size-[1.125rem]",
        iconSm: "size-8 rounded-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";

    // `asChild` forwards to a single child element, so a spinner cannot be
    // injected alongside it without breaking Slot's single-child contract.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);

export { buttonVariants };
