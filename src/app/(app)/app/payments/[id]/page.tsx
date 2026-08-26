import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { getPaymentReceipt } from "@/server/queries/payments";
import { PAYMENT_METHOD_META, labelFor } from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { formatLongDate, formatTime } from "@/lib/dates";
import { formatPhone } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { Flash } from "@/components/app/flash";
import { PageHeader } from "@/components/app/page-header";
import { ReceiptActions } from "@/components/app/payments/receipt-actions";
import { LogoMark } from "@/components/ui/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tenant = await requireTenant();
  const payment = await prisma.payment.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { receiptNumber: true },
  });
  return { title: payment ? `Receipt ${payment.receiptNumber}` : "Receipt" };
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;

  const [payment, settings, business] = await Promise.all([
    getPaymentReceipt(tenant.businessId, id),
    prisma.businessSettings.findUnique({
      where: { businessId: tenant.businessId },
      select: { receiptFooter: true },
    }),
    prisma.business.findUniqueOrThrow({
      where: { id: tenant.businessId },
      select: {
        name: true,
        tagline: true,
        addressLine: true,
        city: true,
        country: true,
        phone: true,
        currency: true,
      },
    }),
  ]);

  if (!payment) notFound();

  const currency = business.currency;

  const message = [
    `Hi ${payment.customer.fullName.split(" ")[0]}, thank you.`,
    `We have received ${formatMoney(payment.amountMinor, currency)}${
      payment.order ? ` for your ${payment.order.title}` : ""
    }.`,
    `Receipt ${payment.receiptNumber}.`,
    payment.order && payment.order.balanceMinor > 0
      ? `Balance outstanding: ${formatMoney(payment.order.balanceMinor, currency)}.`
      : "Your balance is fully settled.",
    `— ${business.name}`,
  ].join(" ");

  return (
    <div className="mx-auto max-w-2xl">
      <Flash
        param="recorded"
        message="Payment recorded."
        description="The balance has been updated and a receipt created."
      />

      <div className="print:hidden">
        <PageHeader
          back={{ href: "/app/payments", label: "Payments" }}
          eyebrow="Receipt"
          title={payment.receiptNumber}
          description={`${formatMoney(payment.amountMinor, currency)} from ${payment.customer.fullName}`}
          actions={
            <ReceiptActions
              paymentId={payment.id}
              whatsappHref={whatsappLink(payment.customer.phone, message)}
              canDelete={tenant.can("payment:delete")}
            />
          }
        />
      </div>

      {/* The receipt itself. Sized and styled to print on plain A5/A4. */}
      <article className="rounded-xl border border-border bg-surface p-7 shadow-xs sm:p-9 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-ink-950">
                <LogoMark className="size-8" />
              </span>
              <p className="font-serif text-lg leading-none font-semibold tracking-tight">
                {business.name}
              </p>
            </div>
            <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
              {business.tagline ? <p>{business.tagline}</p> : null}
              {business.addressLine ? <p>{business.addressLine}</p> : null}
              <p>
                {[business.city, business.country].filter(Boolean).join(", ")}
              </p>
              {business.phone ? <p className="tabular">{formatPhone(business.phone)}</p> : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="eyebrow text-subtle-foreground">Receipt</p>
            <p className="tabular mt-1 text-sm font-semibold">
              {payment.receiptNumber}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatLongDate(payment.receivedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(payment.receivedAt)}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow text-subtle-foreground">Received from</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {payment.customer.fullName}
            </p>
            <p className="tabular text-xs text-muted-foreground">
              {formatPhone(payment.customer.phone)}
            </p>
            <p className="tabular text-xs text-muted-foreground">
              {payment.customer.code}
            </p>
          </div>

          <div>
            <p className="eyebrow text-subtle-foreground">Paid by</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {labelFor(PAYMENT_METHOD_META, payment.method)}
            </p>
            {payment.reference ? (
              <p className="tabular text-xs text-muted-foreground">
                Ref {payment.reference}
              </p>
            ) : null}
            {payment.recordedBy?.name ? (
              <p className="text-xs text-muted-foreground">
                Received by {payment.recordedBy.name}
              </p>
            ) : null}
          </div>
        </section>

        <section className="py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2.5 text-left text-[0.6875rem] font-semibold tracking-[0.08em] text-subtle-foreground uppercase">
                  Description
                </th>
                <th className="pb-2.5 text-right text-[0.6875rem] font-semibold tracking-[0.08em] text-subtle-foreground uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3.5">
                  <p className="font-medium text-foreground">
                    {payment.order ? payment.order.title : "Payment on account"}
                  </p>
                  {payment.order ? (
                    <p className="tabular text-xs text-muted-foreground">
                      Order #{payment.order.code}
                    </p>
                  ) : null}
                  {payment.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.note}
                    </p>
                  ) : null}
                </td>
                <td className="tabular py-3.5 text-right font-medium">
                  {formatMoney(payment.amountMinor, currency)}
                </td>
              </tr>
            </tbody>
          </table>

          <dl className="mt-2 space-y-2 border-t border-border pt-4 text-sm">
            {payment.order ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Outfit total</dt>
                  <dd className="tabular">
                    {formatMoney(payment.order.priceMinor, currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Paid to date</dt>
                  <dd className="tabular text-positive">
                    {formatMoney(payment.order.paidMinor, currency)}
                  </dd>
                </div>
              </>
            ) : null}

            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="font-semibold">
                {payment.order ? "Balance outstanding" : "Amount received"}
              </dt>
              <dd
                className={`tabular text-lg font-semibold ${
                  payment.order && payment.order.balanceMinor > 0
                    ? "text-caution"
                    : "text-positive"
                }`}
              >
                {payment.order
                  ? formatMoney(payment.order.balanceMinor, currency)
                  : formatMoney(payment.amountMinor, currency)}
              </dd>
            </div>
          </dl>
        </section>

        <footer className="border-t border-border pt-5 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {settings?.receiptFooter ?? `Thank you for choosing ${business.name}.`}
          </p>
          {payment.order ? (
            <Link
              href={`/app/orders/${payment.order.id}`}
              className="mt-3 inline-block text-xs text-muted-foreground underline decoration-border-strong underline-offset-2 print:hidden hover:text-foreground"
            >
              Open the order
            </Link>
          ) : null}
        </footer>
      </article>
    </div>
  );
}
