import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellRing,
  CheckCheck,
  CreditCard,
  MessageCircle,
  Plus,
  Receipt,
  Wallet,
  X,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import {
  PAYMENTS_PER_PAGE,
  listPayments,
  paymentSummary,
  pendingReminders,
  unpaidOrders,
} from "@/server/queries/payments";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_META,
  ORDER_STATUS_META,
  labelFor,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { describeDeadline, formatShortDate, monthBounds } from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { buildMessage, whatsappLink } from "@/lib/whatsapp";
import {
  queueReminderAction,
  resolveReminderAction,
} from "@/server/payment-actions";
import { Flash } from "@/components/app/flash";
import { PageHeader } from "@/components/app/page-header";
import { FilterChips, SearchField } from "@/components/app/list-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat";
import { Table, TBody, TD, TH, THead, TR, TableShell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  // The create menu used to land here with a query flag. Send it to the
  // dedicated form so a payment is never half-started on the list page.
  if (params.record === "1") redirect("/app/payments/new");

  const query = typeof params.q === "string" ? params.q : "";
  const methodParam = typeof params.filter === "string" ? params.filter : "ALL";
  const method = (PAYMENT_METHODS as readonly string[]).includes(methodParam)
    ? methodParam
    : undefined;
  const page = Number.parseInt(
    typeof params.page === "string" ? params.page : "1",
    10,
  );

  const currency = tenant.business.currency;
  const canWrite = tenant.can("payment:write");

  const [summary, { payments, total, pageCount, totalMinor }, reminders, unpaid, settings, methodCounts] =
    await Promise.all([
      paymentSummary(tenant.businessId),
      listPayments(tenant.businessId, {
        query,
        method,
        page: Number.isFinite(page) ? page : 1,
      }),
      canWrite ? pendingReminders(tenant.businessId) : Promise.resolve([]),
      unpaidOrders(tenant.businessId, 8),
      prisma.businessSettings.findUnique({
        where: { businessId: tenant.businessId },
        select: { whatsappPaymentTemplate: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { businessId: tenant.businessId },
        _count: { _all: true },
      }),
    ]);

  const countFor = (value: string) =>
    methodCounts.find((row) => row.method === value)?._count._all ?? 0;

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (method) search.set("filter", method);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return suffix ? `/app/payments?${suffix}` : "/app/payments";
  };

  return (
    <div className="mx-auto max-w-[84rem]">
      <Flash param="removed" message="Payment removed." />

      <PageHeader
        title="Payments"
        description="What has come in, what is still owed, and who to remind."
        actions={
          canWrite ? (
            <Button asChild variant="primary" size="sm">
              <Link href="/app/payments/new">
                <Plus />
                Record payment
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Collected in ${monthBounds().label.split(" ")[0]}`}
          value={formatMoney(summary.collectedMinor, currency)}
          hint={pluralise(summary.paymentCount, "payment")}
          delta={
            summary.changePercent === null
              ? null
              : { value: summary.changePercent, label: "vs last month" }
          }
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary.outstandingMinor, currency)}
          hint={`across ${pluralise(summary.outstandingOrders, "outfit")}`}
          tone={summary.outstandingMinor > 0 ? "caution" : "positive"}
        />
        <StatCard
          label="All time"
          value={formatMoney(totalMinor, currency)}
          hint={query || method ? "matching this view" : "every payment recorded"}
        />
        <StatCard
          label="Reminders waiting"
          value={String(summary.pendingReminders)}
          hint={
            summary.pendingReminders === 0
              ? "Nothing to chase"
              : "Ready to send on WhatsApp"
          }
          tone={summary.pendingReminders > 0 ? "caution" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div>
            <SearchField
              placeholder="Search by customer, receipt number or reference…"
              className="sm:max-w-md"
            />
            <FilterChips
              className="mt-4"
              options={[
                { value: "ALL", label: "All methods" },
                ...PAYMENT_METHODS.map((value) => ({
                  value,
                  label: labelFor(PAYMENT_METHOD_META, value),
                  count: countFor(value),
                })),
              ]}
            />
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface shadow-xs">
              <EmptyState
                icon={Receipt}
                title={query ? `Nothing matches “${query}”.` : "No payments yet."}
                message={
                  query
                    ? "Try a customer's name, a receipt number, or a mobile money reference."
                    : "Every payment you record gets a receipt you can print or send, and updates the outfit's balance on its own."
                }
                action={
                  canWrite && !query ? (
                    <Button asChild variant="primary" size="sm">
                      <Link href="/app/payments/new">
                        <Plus />
                        Record a payment
                      </Link>
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <>
              <TableShell>
                <Table>
                  <THead>
                    <tr>
                      <TH>Customer</TH>
                      <TH>For</TH>
                      <TH>Method</TH>
                      <TH>Received</TH>
                      <TH align="right">Amount</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {payments.map((payment) => (
                      <TR key={payment.id}>
                        <TD>
                          <Link
                            href={`/app/payments/${payment.id}`}
                            className="flex items-center gap-2.5"
                          >
                            <Avatar name={payment.customer.fullName} size="xs" />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {payment.customer.fullName}
                              </span>
                              <span className="tabular block truncate text-xs text-muted-foreground">
                                {payment.receiptNumber}
                              </span>
                            </span>
                          </Link>
                        </TD>
                        <TD>
                          {payment.order ? (
                            <Link
                              href={`/app/orders/${payment.order.id}`}
                              className="truncate text-muted-foreground hover:text-foreground"
                            >
                              {payment.order.title}
                            </Link>
                          ) : (
                            <span className="text-subtle-foreground">
                              General payment
                            </span>
                          )}
                        </TD>
                        <TD>
                          <Badge size="sm">
                            {labelFor(PAYMENT_METHOD_META, payment.method)}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-muted-foreground">
                            {formatShortDate(payment.receivedAt)}
                          </span>
                        </TD>
                        <TD align="right">
                          <span className="font-medium text-positive">
                            {formatMoney(payment.amountMinor, currency)}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableShell>

              <Pagination
                page={page > 0 ? page : 1}
                pageCount={pageCount}
                total={total}
                pageSize={PAYMENTS_PER_PAGE}
                buildHref={buildHref}
                label="payments"
              />
            </>
          )}
        </div>

        <div className="space-y-6">
          {/* Who owes you money */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Still to collect</CardTitle>
                <CardDescription>
                  {unpaid.length === 0
                    ? "Everything is settled."
                    : "Largest balances first."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {unpaid.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-positive">
                  <CheckCheck className="size-4" aria-hidden />
                  Nobody owes you anything.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {unpaid.map((order) => {
                    const deadline = describeDeadline(order.deliveryDate);
                    const message = buildMessage(
                      "PAYMENT_REMINDER",
                      {
                        customer: order.customer.fullName,
                        business: tenant.business.name,
                        outfit: order.title,
                        amountMinor: order.balanceMinor,
                        currency,
                      },
                      settings?.whatsappPaymentTemplate,
                    );

                    return (
                      <li key={order.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/app/customers/${order.customer.id}`}
                              className="block truncate text-[0.8125rem] font-medium text-foreground hover:underline hover:decoration-border-strong hover:underline-offset-2"
                            >
                              {order.customer.fullName}
                            </Link>
                            <Link
                              href={`/app/orders/${order.id}`}
                              className="block truncate text-xs text-muted-foreground hover:text-foreground"
                            >
                              {order.title} · {labelFor(ORDER_STATUS_META, order.status)}
                            </Link>
                            {order.deliveryDate ? (
                              <p
                                className={`mt-0.5 text-[0.6875rem] ${
                                  deadline.tone === "critical"
                                    ? "text-critical"
                                    : "text-subtle-foreground"
                                }`}
                              >
                                {deadline.text}
                              </p>
                            ) : null}
                          </div>
                          <span className="tabular shrink-0 text-sm font-semibold text-caution">
                            {formatMoney(order.balanceMinor, currency)}
                          </span>
                        </div>

                        {canWrite ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <Button asChild variant="ghost" size="xs">
                              <a
                                href={whatsappLink(order.customer.phone, message)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle />
                                Remind
                              </a>
                            </Button>
                            <form action={queueReminderAction}>
                              <input
                                type="hidden"
                                name="customerId"
                                value={order.customer.id}
                              />
                              <input type="hidden" name="orderId" value={order.id} />
                              <Button type="submit" variant="ghost" size="xs">
                                <BellRing />
                                Queue
                              </Button>
                            </form>
                            <Button asChild variant="ghost" size="xs">
                              <Link href={`/app/payments/new?order=${order.id}`}>
                                <CreditCard />
                                Record
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Reminder queue */}
          {canWrite ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Reminders</CardTitle>
                  <CardDescription>
                    Written for you. Nothing is sent without you tapping it.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {reminders.length === 0 ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    No reminders waiting. Queue one from the list beside this and
                    it will appear here, and in your Today panel.
                  </p>
                ) : (
                  <ul className="space-y-3.5">
                    {reminders.map((reminder) => (
                      <li
                        key={reminder.id}
                        className="rounded-lg border border-border bg-surface-muted/40 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/app/customers/${reminder.customer.id}`}
                            className="truncate text-[0.8125rem] font-medium text-foreground"
                          >
                            {reminder.customer.fullName}
                          </Link>
                          {reminder.order ? (
                            <span className="tabular shrink-0 text-xs font-medium text-caution">
                              {formatMoney(reminder.order.balanceMinor, currency)}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {reminder.message}
                        </p>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <Button asChild variant="outline" size="xs">
                            <a
                              href={whatsappLink(
                                reminder.customer.phone,
                                reminder.message,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle />
                              Open WhatsApp
                            </a>
                          </Button>
                          <form action={resolveReminderAction}>
                            <input
                              type="hidden"
                              name="reminderId"
                              value={reminder.id}
                            />
                            <input type="hidden" name="status" value="SENT" />
                            <Button type="submit" variant="ghost" size="xs">
                              <CheckCheck />
                              Sent
                            </Button>
                          </form>
                          <form action={resolveReminderAction}>
                            <input
                              type="hidden"
                              name="reminderId"
                              value={reminder.id}
                            />
                            <input type="hidden" name="status" value="DISMISSED" />
                            <Button type="submit" variant="ghost" size="xs">
                              <X />
                            </Button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          {summary.outstandingMinor > 0 ? (
            <Card className="border-accent-border bg-accent-soft/50">
              <CardContent className="px-5 py-5">
                <Wallet className="size-4 text-champagne-600" aria-hidden />
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {formatMoney(summary.outstandingMinor, currency)}
                  </span>{" "}
                  is sitting in {pluralise(summary.outstandingOrders, "unpaid outfit")}.
                  A short WhatsApp message usually settles most of it.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
