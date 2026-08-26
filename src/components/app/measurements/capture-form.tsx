"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  labelFor,
  tenthsToDisplay,
  type MeasurementGroup,
} from "@/lib/domain";
import { toDateInputValue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { recordMeasurementsAction } from "@/server/measurement-actions";
import type { MeasurementFieldRow } from "@/lib/measurement-fields";

export type PreviousValue = { valueTenths: number; unit: string };

/**
 * The measurement capture screen.
 *
 * Two things make it usable while standing in front of a customer with a tape
 * measure: every field shows what it was last time, and nothing is required —
 * a tailor who only remeasures a waist should be able to save just that.
 */
export function MeasurementCaptureForm({
  customerId,
  customerName,
  fields,
  previous,
  previousDate,
  defaultUnit,
}: {
  customerId: string;
  customerName: string;
  fields: MeasurementFieldRow[];
  previous: Record<string, PreviousValue>;
  previousDate: Date | null;
  defaultUnit: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const groups = MEASUREMENT_GROUPS.filter((group) =>
    fields.some((field) => field.group === group),
  );

  const hasPrevious = Object.keys(previous).length > 0;

  /**
   * Most remeasures only change two or three numbers. Copying last session's
   * values in first means the tailor edits differences rather than retyping a
   * whole body.
   */
  const copyPrevious = () => {
    const form = formRef.current;
    if (!form) return;

    for (const field of fields) {
      const input = form.elements.namedItem(`m.${field.key}`);
      const value = previous[field.key];
      if (input instanceof HTMLInputElement && value) {
        input.value = tenthsToDisplay(value.valueTenths);
      }
    }
    setCopied(true);
  };

  return (
    <ActionForm action={recordMeasurementsAction} className="space-y-6">
      {/* The ref lets "copy last session" reach the inputs without turning
          every field into controlled React state. */}
      <FormRefBridge formRef={formRef} />

      <input type="hidden" name="customerId" value={customerId} />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>This session</CardTitle>
            <CardDescription>
              Saved as a new record. {customerName}&apos;s previous measurements
              are never overwritten.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Date measured"
            htmlFor="measuredAt"
            error={<FieldError name="measuredAt" />}
          >
            <Input
              id="measuredAt"
              name="measuredAt"
              type="date"
              defaultValue={toDateInputValue(new Date())}
            />
          </Field>

          <Field label="Unit" htmlFor="unit">
            <div className="flex gap-2">
              {(["in", "cm"] as const).map((unit) => (
                <label
                  key={unit}
                  className={cn(
                    "flex-1 cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-2.5 text-center text-sm font-medium text-muted-foreground transition-all",
                    "hover:border-ink-300",
                    "has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950 has-[:checked]:text-ivory-100",
                  )}
                >
                  <input
                    type="radio"
                    name="unit"
                    value={unit}
                    defaultChecked={defaultUnit === unit}
                    className="sr-only"
                  />
                  {unit === "in" ? "Inches" : "Centimetres"}
                </label>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

      {hasPrevious ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>
              Last measured{" "}
              {previousDate
                ? previousDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "previously"}
              . Those values are shown under each field.
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={copyPrevious}
            className="shrink-0"
          >
            {copied ? "Copied in" : "Start from last session"}
          </Button>
        </div>
      ) : null}

      {groups.map((group) => (
        <MeasurementGroupCard
          key={group}
          group={group}
          fields={fields.filter((field) => field.group === group)}
          previous={previous}
        />
      ))}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Notes on this session</CardTitle>
            <CardDescription>
              Anything that explains the numbers — post-partum, weight change, a
              fabric that needs extra ease.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            rows={3}
            placeholder="Measured over a light blouse. Waist a little fuller than last year."
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={`/app/customers/${customerId}?tab=measurements`}>Cancel</Link>
        </Button>
        <SubmitButton variant="primary" pendingLabel="Saving…">
          Save measurements
          <ArrowRight />
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function MeasurementGroupCard({
  group,
  fields,
  previous,
}: {
  group: MeasurementGroup;
  fields: MeasurementFieldRow[];
  previous: Record<string, PreviousValue>;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{labelFor(MEASUREMENT_GROUP_META, group)}</CardTitle>
          <CardDescription>
            {MEASUREMENT_GROUP_META[group]?.hint ?? "Leave blank what you did not measure."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const last = previous[field.key];
          return (
            <Field
              key={field.key}
              label={field.label}
              htmlFor={`m.${field.key}`}
              hint={
                last
                  ? `Last time: ${tenthsToDisplay(last.valueTenths)}${last.unit}`
                  : undefined
              }
              error={<FieldError name={`m.${field.key}`} />}
            >
              <Input
                id={`m.${field.key}`}
                name={`m.${field.key}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={last ? tenthsToDisplay(last.valueTenths) : "—"}
                className="tabular"
              />
            </Field>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** Attaches the enclosing form to a ref without owning the form element. */
function FormRefBridge({
  formRef,
}: {
  formRef: React.MutableRefObject<HTMLFormElement | null>;
}) {
  const anchor = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    formRef.current = anchor.current?.closest("form") ?? null;
  }, [formRef]);

  return <span ref={anchor} hidden aria-hidden />;
}
