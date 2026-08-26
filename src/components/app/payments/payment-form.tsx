"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Smartphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PAYMENT_METHODS, PAYMENT_METHOD_META, labelFor } from "@/lib/domain";
import { currencySymbol, formatMoney } from "@/lib/money";
import { toDateInputValue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { recordPaymentAction } from "@/server/payment-actions";

const METHOD_ICON: Record<string, LucideIcon> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Landmark,
  CARD: CreditCard,
  OTHER: MoreHorizontal,
};

const METHOD_HINT: Record<string, string> = {
  CASH: "Taken at the counter",
  MOBILE_MONEY: "MoMo — needs a reference",
  BANK_TRANSFER: "Needs a reference",
  CARD: "Card terminal",
  OTHER: "Anything else",
};

export type PayableOrder = {
  id: string;
  code: string;
  title: string;
  balanceMinor: number;
  customerId: string;
};

export type PayingCustomer = {
  id: string;
  fullName: string;
  code: string;
  outstandingMinor: number;
};

/**
 * Recording a payment is the single most frequent thing a tailor does after
 * taking an order, so it is built for speed: pick the outfit, tap the full
 * balance, choose how it came in, done.
 */
export function PaymentForm({
  customers,
  orders,
  currency,
  defaultCustomerId,
  defaultOrderId,
  cancelHref,
}: {
  customers: PayingCustomer[];
  orders: PayableOrder[];
  currency: string;
  defaultCustomerId?: string;
  defaultOrderId?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = React.useState(
    defaultCustomerId ??
      (defaultOrderId
        ? (orders.find((order) => order.id === defaultOrderId)?.customerId ?? "")
        : ""),
  );
  const [orderId, setOrderId] = React.useState(defaultOrderId ?? "");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("CASH");

  const customerOrders = orders.filter((order) => order.customerId === customerId);
  const selectedOrder = customerOrders.find((order) => order.id === orderId) ?? null;
  const customer = customers.find((entry) => entry.id === customerId) ?? null;

  // Choosing a different customer invalidates the order beneath it.
  React.useEffect(() => {
    if (orderId && !orders.some((o) => o.id === orderId && o.customerId === customerId)) {
      setOrderId("");
    }
  }, [customerId, orderId, orders]);

  const balance = selectedOrder?.balanceMinor ?? customer?.outstandingMinor ?? 0;
  const needsReference = method === "MOBILE_MONEY" || method === "BANK_TRANSFER";

  return (
    <ActionForm action={recordPaymentAction} className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Who is paying?</CardTitle>
            <CardDescription>
              Only customers with an outstanding balance are listed.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
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
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Choose a customer…</option>
              {customers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.fullName}
                  {entry.outstandingMinor > 0
                    ? ` — ${formatMoney(entry.outstandingMinor, currency)} owed`
                    : ""}
                </option>
              ))}
            </Select>
          </Field>

          {customerId ? (
            customerOrders.length > 0 ? (
              <Field
                label="Which outfit is this for?"
                htmlFor="orderId"
                hint="Leave on “Not for a specific outfit” for a general payment."
                error={<FieldError name="orderId" />}
              >
                <Select
                  id="orderId"
                  name="orderId"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                >
                  <option value="">Not for a specific outfit</option>
                  {customerOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.title} — {formatMoney(order.balanceMinor, currency)}{" "}
                      outstanding
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <p className="rounded-lg bg-surface-muted/60 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
                This customer has no outfit with a balance on it. The payment will
                be recorded against their record.
              </p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>How much, and how?</CardTitle>
            {balance > 0 ? (
              <CardDescription>
                {formatMoney(balance, currency)} outstanding
                {selectedOrder ? ` on ${selectedOrder.title}` : ""}.
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            label="Amount"
            htmlFor="amountMinor"
            required
            error={<FieldError name="amountMinor" />}
          >
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-subtle-foreground">
                {currencySymbol(currency)}
              </span>
              <Input
                id="amountMinor"
                name="amountMinor"
                inputMode="decimal"
                required
                autoFocus
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="tabular pl-12 text-lg"
              />
            </div>

            {balance > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                <QuickAmount
                  label={`Full balance · ${formatMoney(balance, currency)}`}
                  onClick={() => setAmount((balance / 100).toString())}
                />
                <QuickAmount
                  label="Half"
                  onClick={() =>
                    setAmount((Math.round(balance / 2) / 100).toString())
                  }
                />
              </div>
            ) : null}
          </Field>

          <Field label="Paid by" required>
            <input type="hidden" name="method" value={method} />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {PAYMENT_METHODS.map((value) => {
                const Icon = METHOD_ICON[value] ?? Banknote;
                const selected = method === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1.5 rounded-lg border p-3.5 text-left transition-all duration-150",
                      selected
                        ? "border-ink-950 bg-ink-950/[0.03] shadow-xs"
                        : "border-border-strong bg-surface hover:border-ink-300",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        selected ? "text-foreground" : "text-subtle-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="text-[0.8125rem] font-medium text-foreground">
                      {labelFor(PAYMENT_METHOD_META, value)}
                    </span>
                    <span className="text-[0.6875rem] leading-tight text-muted-foreground">
                      {METHOD_HINT[value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Reference"
              htmlFor="reference"
              required={needsReference}
              hint={
                needsReference
                  ? "The transaction ID from the message."
                  : "Optional."
              }
              error={<FieldError name="reference" />}
            >
              <Input
                id="reference"
                name="reference"
                placeholder={needsReference ? "MP240815.1423.A12345" : "—"}
                className="tabular"
              />
            </Field>

            <Field
              label="Date received"
              htmlFor="receivedAt"
              error={<FieldError name="receivedAt" />}
            >
              <Input
                id="receivedAt"
                name="receivedAt"
                type="date"
                defaultValue={toDateInputValue(new Date())}
              />
            </Field>
          </div>

          <Field label="Note" htmlFor="note" error={<FieldError name="note" />}>
            <Textarea
              id="note"
              name="note"
              rows={2}
              placeholder="Balance to be settled on collection."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
        <SubmitButton variant="primary" pendingLabel="Recording…">
          Record payment
        </SubmitButton>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:text-right">
        A receipt is created automatically. You can print or share it afterwards.{" "}
        <Link
          href="/app/payments"
          className="underline decoration-border-strong underline-offset-2 hover:text-foreground"
        >
          See all payments
        </Link>
      </p>
    </ActionForm>
  );
}

function QuickAmount({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tabular cursor-pointer rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-ink-300 hover:text-foreground"
    >
      {label}
    </button>
  );
}
