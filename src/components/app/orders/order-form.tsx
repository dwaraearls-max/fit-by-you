"use client";

import * as React from "react";
import Link from "next/link";
import { Info, Ruler } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { ChoiceCard, Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  FABRIC_PREFERENCES,
  FABRIC_PREFERENCE_META,
  OUTFIT_TYPES,
  OUTFIT_TYPE_META,
  labelFor,
} from "@/lib/domain";
import { currencySymbol, formatMoney } from "@/lib/money";
import { toDateInputValue } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";

export type OrderCustomerOption = {
  id: string;
  fullName: string;
  code: string;
};

export type MeasurementSetOption = {
  id: string;
  label: string;
  summary: string;
  isLatest: boolean;
};

export type OrderFormValues = {
  id?: string;
  customerId?: string;
  title?: string;
  outfitType?: string;
  description?: string | null;
  fabric?: string | null;
  fabricNotes?: string | null;
  measurementSetId?: string | null;
  priceMinor?: number;
  deliveryDate?: Date | null;
  fittingDate?: Date | null;
  priority?: string;
  notes?: string | null;
};

export function OrderForm({
  action,
  customers,
  measurementSets,
  currency,
  values,
  submitLabel,
  cancelHref,
  lockedCustomer,
  showDeposit = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customers: OrderCustomerOption[];
  measurementSets: MeasurementSetOption[];
  currency: string;
  values?: OrderFormValues;
  submitLabel: string;
  cancelHref: string;
  /** When arriving from a customer profile the customer is already decided. */
  lockedCustomer?: OrderCustomerOption | null;
  showDeposit?: boolean;
}) {
  const [depositMinor, setDepositMinor] = React.useState("");
  const [price, setPrice] = React.useState(
    values?.priceMinor ? (values.priceMinor / 100).toString() : "",
  );

  const priceValue = Number.parseFloat(price.replace(/[^\d.]/g, "")) || 0;
  const depositValue = Number.parseFloat(depositMinor.replace(/[^\d.]/g, "")) || 0;
  const balance = Math.max(0, priceValue - depositValue);

  return (
    <ActionForm action={action} className="space-y-6">
      {values?.id ? <input type="hidden" name="orderId" value={values.id} /> : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Who is it for?</CardTitle>
            <CardDescription>
              The outfit is cut from this customer&apos;s measurements.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {lockedCustomer ? (
            <>
              <input type="hidden" name="customerId" value={lockedCustomer.id} />
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {lockedCustomer.fullName}
                  </p>
                  <p className="tabular text-xs text-muted-foreground">
                    {lockedCustomer.code}
                  </p>
                </div>
                {values?.id ? null : (
                  <Button asChild variant="ghost" size="xs">
                    <Link href="/app/orders/new">Change</Link>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Field
              label="Customer"
              htmlFor="customerId"
              required
              error={<FieldError name="customerId" />}
            >
              <Select
                id="customerId"
                name="customerId"
                required
                defaultValue={values?.customerId ?? ""}
              >
                <option value="">Choose a customer…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} · {customer.code}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {measurementSets.length > 0 ? (
            <Field
              label="Cut from these measurements"
              hint="Older sessions stay available, so a garment always records the numbers it was actually made from."
            >
              <div className="space-y-2.5">
                {measurementSets.map((set) => (
                  <label
                    key={set.id}
                    className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border-strong bg-surface p-3.5 transition-all hover:border-ink-300 has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950/[0.03]"
                  >
                    <input
                      type="radio"
                      name="measurementSetId"
                      value={set.id}
                      defaultChecked={
                        values?.measurementSetId
                          ? values.measurementSetId === set.id
                          : set.isLatest
                      }
                      className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-full border border-border-strong bg-surface checked:border-[5px] checked:border-ink-950"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {set.label}
                        </span>
                        {set.isLatest ? (
                          <Badge size="sm" tone="accent">
                            Latest
                          </Badge>
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {set.summary}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          ) : lockedCustomer ? (
            <div className="flex flex-col gap-3 rounded-lg border border-caution/30 bg-caution-soft/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>
                  {lockedCustomer.fullName} has no measurements yet. You can still
                  take the order, but measure before you cut.
                </span>
              </p>
              <Button asChild variant="outline" size="xs" className="shrink-0">
                <Link href={`/app/customers/${lockedCustomer.id}/measure`}>
                  <Ruler />
                  Measure now
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>What are you making?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Outfit name"
            htmlFor="title"
            required
            hint="What you would call it when the customer rings."
            error={<FieldError name="title" />}
            className="sm:col-span-2"
          >
            <Input
              id="title"
              name="title"
              required
              autoFocus={!!lockedCustomer}
              defaultValue={values?.title ?? ""}
              placeholder="Kente Evening Dress"
            />
          </Field>

          <Field
            label="Type"
            htmlFor="outfitType"
            required
            error={<FieldError name="outfitType" />}
          >
            <Select
              id="outfitType"
              name="outfitType"
              defaultValue={values?.outfitType ?? "DRESS"}
            >
              {OUTFIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labelFor(OUTFIT_TYPE_META, type)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Fabric"
            htmlFor="fabric"
            hint="Type anything, or pick a common one."
            error={<FieldError name="fabric" />}
          >
            <Input
              id="fabric"
              name="fabric"
              list="fabric-options"
              defaultValue={values?.fabric ?? ""}
              placeholder="Kente"
            />
            <datalist id="fabric-options">
              {FABRIC_PREFERENCES.map((fabric) => (
                <option key={fabric} value={labelFor(FABRIC_PREFERENCE_META, fabric)} />
              ))}
            </datalist>
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            className="sm:col-span-2"
            error={<FieldError name="description" />}
          >
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values?.description ?? ""}
              placeholder="Floor-length, boat neck, short puff sleeves, hidden back zip."
            />
          </Field>

          <Field
            label="Fabric notes"
            htmlFor="fabricNotes"
            hint="Who is supplying it, how many yards, anything unusual about it."
            className="sm:col-span-2"
            error={<FieldError name="fabricNotes" />}
          >
            <Input
              id="fabricNotes"
              name="fabricNotes"
              defaultValue={values?.fabricNotes ?? ""}
              placeholder="Customer bringing 6 yards on Thursday"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Price and dates</CardTitle>
            <CardDescription>
              The balance updates itself as payments come in.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Total price"
            htmlFor="priceMinor"
            required
            error={<FieldError name="priceMinor" />}
          >
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle-foreground">
                {currencySymbol(currency)}
              </span>
              <Input
                id="priceMinor"
                name="priceMinor"
                inputMode="decimal"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="1200"
                className="tabular pl-12"
              />
            </div>
          </Field>

          {showDeposit ? (
            <Field
              label="Deposit taken now"
              htmlFor="depositMinor"
              hint="Leave blank if nothing was paid yet."
              error={<FieldError name="depositMinor" />}
            >
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle-foreground">
                  {currencySymbol(currency)}
                </span>
                <Input
                  id="depositMinor"
                  name="depositMinor"
                  inputMode="decimal"
                  value={depositMinor}
                  onChange={(event) => setDepositMinor(event.target.value)}
                  placeholder="400"
                  className="tabular pl-12"
                />
              </div>
            </Field>
          ) : null}

          {showDeposit && depositValue > 0 ? (
            <>
              <Field label="Deposit paid by" htmlFor="depositMethod">
                <Select id="depositMethod" name="depositMethod" defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>

              <div className="flex items-end">
                <div className="w-full rounded-lg bg-surface-muted/60 px-4 py-3">
                  <p className="eyebrow text-subtle-foreground">Balance after deposit</p>
                  <p className="tabular mt-1.5 text-lg font-semibold text-foreground">
                    {formatMoney(Math.round(balance * 100), currency)}
                  </p>
                </div>
              </div>
            </>
          ) : null}

          <Field
            label="Delivery date"
            htmlFor="deliveryDate"
            hint="When the customer expects to collect."
            error={<FieldError name="deliveryDate" />}
          >
            <Input
              id="deliveryDate"
              name="deliveryDate"
              type="date"
              defaultValue={toDateInputValue(values?.deliveryDate ?? null)}
            />
          </Field>

          <Field
            label="Fitting date"
            htmlFor="fittingDate"
            hint="Optional. Adds itself to your calendar."
            error={<FieldError name="fittingDate" />}
          >
            <Input
              id="fittingDate"
              name="fittingDate"
              type="date"
              defaultValue={toDateInputValue(values?.fittingDate ?? null)}
            />
          </Field>

          <Field label="Priority" className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                name="priority"
                value="NORMAL"
                label="Normal"
                description="Fits into your usual schedule."
                defaultChecked={(values?.priority ?? "NORMAL") === "NORMAL"}
              />
              <ChoiceCard
                name="priority"
                value="RUSH"
                label="Rush"
                description="Flagged everywhere so it does not get buried."
                defaultChecked={values?.priority === "RUSH"}
              />
            </div>
          </Field>

          <Field
            label="Internal notes"
            htmlFor="notes"
            hint="Only your team sees this."
            className="sm:col-span-2"
            error={<FieldError name="notes" />}
          >
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={values?.notes ?? ""}
              placeholder="Lining to be bought separately. Customer wants to approve the neckline before sewing."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton variant="primary" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
