import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Camera,
  CreditCard,
  MessageCircle,
  Pencil,
  Phone,
  Ruler,
  Wallet,
  Zap,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { getOrder } from "@/server/queries/orders";
import {
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  ORDER_STATUS_META,
  OUTFIT_TYPE_META,
  PAYMENT_METHOD_META,
  PHOTO_CATEGORY_META,
  labelFor,
  tenthsToDisplay,
  toneFor,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { buildMessage, whatsappLink } from "@/lib/whatsapp";
import {
  describeDeadline,
  formatLongDate,
  formatShortDate,
} from "@/lib/dates";
import { formatPhone, percent } from "@/lib/utils";
import { Flash } from "@/components/app/flash";
import { PageHeader } from "@/components/app/page-header";
import { StatusTracker } from "@/components/app/orders/status-tracker";
import { OrderTimeline } from "@/components/app/orders/timeline";
import {
  AddNotePanel,
  FittingsPanel,
} from "@/components/app/orders/order-panels";
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
import { DataPoint } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tenant = await requireTenant();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { code: true, title: true },
  });
  return { title: order ? `#${order.code} — ${order.title}` : "Order" };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;

  const order = await getOrder(tenant.businessId, id);
  if (!order) notFound();

  const currency = tenant.business.currency;
  const canEdit = tenant.can("order:write");
  const deadline = describeDeadline(order.deliveryDate);
  const paidPercent = percent(order.paidMinor, Math.max(1, order.priceMinor));

  const settings = await prisma.businessSettings.findUnique({
    where: { businessId: tenant.businessId },
    select: {
      whatsappOrderTemplate: true,
      whatsappPaymentTemplate: true,
      whatsappFittingTemplate: true,
    },
  });

  const updateHref = whatsappLink(
    order.customer.phone,
    buildMessage(
      "ORDER_UPDATE",
      {
        customer: order.customer.fullName,
        business: tenant.business.name,
        outfit: order.title,
        status: order.status,
      },
      settings?.whatsappOrderTemplate,
    ),
  );

  const reminderHref = whatsappLink(
    order.customer.phone,
    buildMessage(
      "PAYMENT_REMINDER",
      {
        customer: order.customer.fullName,
        business: tenant.business.name,
        outfit: order.title,
        amountMinor: order.balanceMinor,
        currency,
      },
      settings?.whatsappPaymentTemplate,
    ),
  );

  const snapshot = order.measurementSet;
  const snapshotGroups = snapshot
    ? MEASUREMENT_GROUPS.filter((group) =>
        snapshot.values.some((value) => value.group === group),
      )
    : [];

  return (
    <div className="mx-auto max-w-[84rem]">
      <Flash
        param="created"
        message="Order created."
        description="It is now on your orders board and in the customer's history."
      />

      <PageHeader
        back={{ href: "/app/orders", label: "Orders" }}
        eyebrow={`Order #${order.code}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.title}
            {order.priority === "RUSH" ? (
              <Badge tone="critical">
                <Zap className="size-2.5" aria-hidden />
                Rush
              </Badge>
            ) : null}
          </span>
        }
        description={
          <>
            {labelFor(OUTFIT_TYPE_META, order.outfitType)}
            {order.fabric ? ` in ${order.fabric}` : ""} for{" "}
            <Link
              href={`/app/customers/${order.customer.id}`}
              className="font-medium text-foreground underline decoration-border-strong underline-offset-2 hover:decoration-foreground"
            >
              {order.customer.fullName}
            </Link>
            . Started {formatLongDate(order.createdAt)}.
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={updateHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                Send update
              </a>
            </Button>
            {canEdit ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/orders/${order.id}/edit`}>
                  <Pencil />
                  Edit
                </Link>
              </Button>
            ) : null}
            {tenant.can("payment:write") && order.balanceMinor > 0 ? (
              <Button asChild variant="primary" size="sm">
                <Link href={`/app/payments/new?order=${order.id}`}>
                  <CreditCard />
                  Record payment
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="space-y-6">
        <StatusTracker orderId={order.id} status={order.status} canEdit={canEdit} />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Money */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    {order.balanceMinor > 0
                      ? `${formatMoney(order.balanceMinor, currency)} still to collect.`
                      : "Settled in full."}
                  </CardDescription>
                </div>
                {order.balanceMinor > 0 ? (
                  <Button asChild variant="ghost" size="xs">
                    <a href={reminderHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle />
                      Send reminder
                    </a>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <DataPoint
                    label="Total"
                    value={formatMoney(order.priceMinor, currency)}
                    emphasis
                  />
                  <DataPoint
                    label="Paid"
                    value={
                      <span className="text-positive">
                        {formatMoney(order.paidMinor, currency)}
                      </span>
                    }
                    emphasis
                  />
                  <DataPoint
                    label="Outstanding"
                    value={
                      order.balanceMinor > 0 ? (
                        <span className="text-caution">
                          {formatMoney(order.balanceMinor, currency)}
                        </span>
                      ) : (
                        <span className="text-positive">Nil</span>
                      )
                    }
                    emphasis
                  />
                </div>

                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-positive transition-all duration-500"
                    style={{ width: `${Math.min(100, paidPercent)}%` }}
                  />
                </div>

                {order.payments.length > 0 ? (
                  <ul className="mt-5 divide-y divide-border border-t border-border pt-1">
                    {order.payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="tabular text-[0.8125rem] font-medium text-foreground">
                            {formatMoney(payment.amountMinor, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatShortDate(payment.receivedAt)} ·{" "}
                            {payment.receiptNumber}
                          </p>
                        </div>
                        <Badge
                          size="sm"
                          tone={toneFor(PAYMENT_METHOD_META, payment.method)}
                        >
                          {labelFor(PAYMENT_METHOD_META, payment.method)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                    No payments recorded against this order yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Measurement snapshot */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Cut from</CardTitle>
                  <CardDescription>
                    {snapshot
                      ? `Measurements taken ${formatLongDate(snapshot.measuredAt)} by ${snapshot.measuredByName}.`
                      : "No measurements attached to this order."}
                  </CardDescription>
                </div>
                {snapshot ? (
                  <Badge tone="accent">{snapshot.unit}</Badge>
                ) : null}
              </CardHeader>
              <CardContent>
                {snapshot ? (
                  <div className="space-y-5">
                    {snapshotGroups.map((group) => (
                      <div key={group}>
                        <p className="eyebrow mb-2.5 text-subtle-foreground">
                          {labelFor(MEASUREMENT_GROUP_META, group)}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {snapshot.values
                            .filter((value) => value.group === group)
                            .map((value) => (
                              <span
                                key={value.fieldKey}
                                className="text-xs text-muted-foreground"
                              >
                                {value.fieldLabel}{" "}
                                <span className="tabular text-sm font-semibold text-foreground">
                                  {tenthsToDisplay(value.valueTenths)}
                                </span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                    <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                      This is the exact snapshot the outfit was cut from. Later
                      measurement sessions do not change it.
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={Ruler}
                    title="No measurements attached."
                    message={`Measure ${order.customer.firstName} and attach the session, so you always know what this piece was cut from.`}
                    action={
                      tenant.can("measurement:write") ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/app/customers/${order.customer.id}/measure`}>
                            <Ruler />
                            Take measurements
                          </Link>
                        </Button>
                      ) : null
                    }
                  />
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Reference photos</CardTitle>
                  <CardDescription>
                    What the customer asked for, and what you made.
                  </CardDescription>
                </div>
                {tenant.can("photo:write") ? (
                  <Button asChild variant="outline" size="xs">
                    <Link
                      href={`/app/customers/${order.customer.id}/photos?order=${order.id}`}
                    >
                      <Camera />
                      Add photos
                    </Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {order.photos.length === 0 ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Nothing attached yet. A picture of the style the customer
                    brought in saves a lot of explaining later.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {order.photos.map((photo) => (
                      <figure
                        key={photo.id}
                        className="overflow-hidden rounded-lg border border-border"
                      >
                        <div className="aspect-square bg-surface-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/files/${photo.storageKey}`}
                            alt={
                              photo.caption ??
                              labelFor(PHOTO_CATEGORY_META, photo.category)
                            }
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                        </div>
                      </figure>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>
                    Everything that has happened to this outfit.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <OrderTimeline events={order.timeline} />
                {canEdit ? (
                  <div className="mt-6 border-t border-border pt-5">
                    <AddNotePanel orderId={order.id} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Customer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/app/customers/${order.customer.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted/60"
                >
                  <Avatar name={order.customer.fullName} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.customer.fullName}
                    </p>
                    <p className="tabular truncate text-xs text-muted-foreground">
                      {formatPhone(order.customer.phone)}
                    </p>
                  </div>
                </Link>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${order.customer.phone}`}>
                      <Phone />
                      Call
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={updateHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle />
                      Message
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <DataPoint
                    label="Stage"
                    value={labelFor(ORDER_STATUS_META, order.status)}
                  />
                  <DataPoint
                    label="Delivery"
                    value={
                      order.deliveryDate ? (
                        <span
                          className={
                            deadline.tone === "critical"
                              ? "text-critical"
                              : deadline.tone === "caution"
                                ? "text-caution"
                                : undefined
                          }
                        >
                          {formatLongDate(order.deliveryDate)} · {deadline.text}
                        </span>
                      ) : (
                        "No date set"
                      )
                    }
                  />
                  {order.fittingDate ? (
                    <DataPoint
                      label="Fitting"
                      value={formatLongDate(order.fittingDate)}
                    />
                  ) : null}
                  {order.fabricNotes ? (
                    <DataPoint label="Fabric notes" value={order.fabricNotes} />
                  ) : null}
                  <DataPoint
                    label="Taken by"
                    value={order.createdBy?.name ?? "—"}
                  />
                </dl>

                {order.description ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="eyebrow mb-2 text-subtle-foreground">
                      Description
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                      {order.description}
                    </p>
                  </div>
                ) : null}

                {order.notes ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="eyebrow mb-2 text-subtle-foreground">
                      Internal notes
                    </p>
                    <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                      {order.notes}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <FittingsPanel
              orderId={order.id}
              fittings={order.fittings.map((fitting) => ({
                ...fitting,
                whatsappHref: whatsappLink(
                  order.customer.phone,
                  buildMessage(
                    "FITTING",
                    {
                      customer: order.customer.fullName,
                      business: tenant.business.name,
                      outfit: order.title,
                      date: fitting.scheduledFor,
                    },
                    settings?.whatsappFittingTemplate,
                  ),
                ),
              }))}
              suggestedDate={order.fittingDate ?? order.deliveryDate ?? null}
              canEdit={tenant.can("calendar:write")}
            />

            {order.balanceMinor > 0 && tenant.can("payment:write") ? (
              <Card className="border-caution/30 bg-caution-soft/50">
                <CardContent className="px-5 py-5">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="size-4 text-caution" aria-hidden />
                    <p className="text-sm font-semibold text-foreground">
                      {formatMoney(order.balanceMinor, currency)} outstanding
                    </p>
                  </div>
                  <Button asChild variant="primary" size="sm" className="mt-4 w-full">
                    <Link href={`/app/payments/new?order=${order.id}`}>
                      <CreditCard />
                      Record a payment
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
