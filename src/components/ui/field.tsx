import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Form controls are deliberately native elements rather than Radix wrappers.
 * Server Actions read `FormData`, and native inputs also give mobile users the
 * real OS pickers — which matters when a tailor is standing in front of a
 * customer with one hand on their phone.
 */

const controlBase = [
  "w-full rounded-md border border-border-strong bg-surface text-foreground",
  "placeholder:text-subtle-foreground",
  "transition-all duration-150",
  "hover:border-ink-300",
  "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
  "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/12",
].join(" ");

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(controlBase, "h-11 px-3.5 text-sm", className)}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "resize-y px-3.5 py-3 text-sm leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          controlBase,
          "h-11 appearance-none pr-10 pl-3.5 text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle-foreground"
      />
    </div>
  );
});

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "block text-[0.8125rem] leading-none font-medium text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-critical">*</span> : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-critical">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface",
        "transition-all duration-150",
        "checked:border-ink-950 checked:bg-ink-950",
        "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.5l3.5 3.5L13 4.5%22/></svg>')] checked:bg-center checked:bg-no-repeat",
        "hover:border-ink-400",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Switch({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative inline-flex shrink-0">
      <input
        type="checkbox"
        role="switch"
        className={cn(
          "peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-ink-200 transition-colors duration-200",
          "checked:bg-ink-950 dark:bg-ink-700 dark:checked:bg-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
      />
    </span>
  );
}

/** Radio or checkbox rendered as a selectable card — used for fit, role, plan. */
export function ChoiceCard({
  name,
  value,
  label,
  description,
  type = "radio",
  defaultChecked,
  className,
}: {
  name: string;
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  type?: "radio" | "checkbox";
  defaultChecked?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg border border-border-strong bg-surface p-3.5",
        "transition-all duration-150 hover:border-ink-300 hover:bg-surface-muted/50",
        "has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950/[0.03] has-[:checked]:shadow-xs",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        className,
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className={cn(
          "mt-0.5 size-[1.125rem] shrink-0 cursor-pointer appearance-none border border-border-strong bg-surface transition-all",
          type === "radio" ? "rounded-full" : "rounded-[5px]",
          "checked:border-[5px] checked:border-ink-950",
          "focus-visible:outline-none",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Compact pill used for multi-select preferences (fabrics, styles). */
export function PillToggle({
  name,
  value,
  label,
  defaultChecked,
  swatch,
}: {
  name: string;
  value: string;
  label: React.ReactNode;
  defaultChecked?: boolean;
  swatch?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[0.8125rem] font-medium text-muted-foreground",
        "transition-all duration-150 hover:border-ink-300 hover:text-foreground",
        "has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950 has-[:checked]:text-ivory-100",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {swatch ? (
        <span
          aria-hidden
          className="size-3.5 rounded-full border border-black/10"
          style={{ backgroundColor: swatch }}
        />
      ) : null}
      {label}
    </label>
  );
}
