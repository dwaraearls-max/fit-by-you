import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CreditCard,
  Images,
  Package,
  Palette,
  Plus,
  Ruler,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { getCustomerProfile } from "@/server/queries/customers";
import { getMeasurementHistory } from "@/server/services/measurements";
import {
  COLOR_PREFERENCES,
  FABRIC_PREFERENCE_META,
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  ORDER_STATUS_META,
  OUTFIT_TYPE_META,
  PAYMENT_METHOD_META,
  PHOTO_CATEGORY_META,
  PREFERRED_FIT_META,
  STYLE_PREFERENCE_META,
  colorHex,
  labelFor,
  orderProgress,
  tenthsToDisplay,
  toneFor,
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { buildMessage, whatsappLink } from "@/lib/whatsapp";
import {
  describeDeadline,
  formatFriendlyDate,
  formatLongDate,
  formatShortDate,
  timeAgo,
} from "@/lib/dates";
import { pluralise } from "@/lib/utils";
import { Flash } from "@/components/app/flash";
import { ProfileHeader } from "@/components/app/customer/profile-header";
import { FitMemoryPanel } from "@/components/app/customer/fit-memory-panel";
import { WelcomeBack } from "@/components/app/customer/welcome-back";
import { NotesTab } from "@/components/app/customer/notes-tab";
import { PhotoGallery } from "@/components/app/photos/gallery";
import { TabBar } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataPoint } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR, TableShell } from "@/components/ui/table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tenant = await requireTenant();
  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, businessId: tenant.businessId },
    select: { fullName: true },
  });
  return { title: customer?.fullName ?? "Customer" };
}

const TABS = [
  "overview",
  "measurements",
  "orders",
  "styles",
  "photos",
  "payments",
  "notes",
] as const;

export default async function CustomerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;
  const search = await searchParams;

  const profile = await getCustomerProfile(
    tenant.businessId,
    id,
    tenant.business.currency,
  );
  if (!profile) notFound();

  const { customer, orders, fitMemory, outstandingMinor, totalPaidMinor } = profile;

  const tabParam = typeof search.tab === "string" ? search.tab : "overview";
  const tab = (TABS as readonly string[]).includes(tabParam)
    ? (tabParam as (typeof TABS)[number])
    : "overview";

  const settings = await prisma.businessSettings.findUnique({
    where: { businessId: tenant.businessId },
    select: { whatsappOrderTemplate: true },
  });

  const activeOrder = orders.find(
    (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
  );

  const whatsappHref = whatsappLink(
    customer.phone,
    buildMessage(
      "ORDER_UPDATE",
      {
        customer: customer.fullName,
        business: tenant.business.name,
        outfit: activeOrder?.title ?? null,
        status: activeOrder?.status ?? null,
      },
      settings?.whatsappOrderTemplate,
    ),
  );

  const justCreated = search.welcome === "1";

  return (
    <div className="mx-auto max-w-[84rem]">
      <Flash
        param="saved"
        message="Measurements saved."
        description="Nothing was overwritten — this is a new record in the history."
      />

      <ProfileHeader
        customer={{
          id: customer.id,
          code: customer.code,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          photoKey: customer.photoKey,
          status: customer.status,
          customerSince: customer.customerSince,
          tags: customer.tags.map((tag) => tag.label),
        }}
        businessName={tenant.business.name}
        whatsappHref={whatsappHref}
        permissions={{
          write: tenant.can("customer:write"),
          delete: tenant.can("customer:delete"),
          measure: tenant.can("measurement:write"),
          order: tenant.can("order:write"),
        }}
      />

      {justCreated ? (
        <div className="mb-6 rounded-xl border border-accent-border bg-accent-soft px-5 py-4">
          <p className="text-sm font-semibold text-foreground">
            {customer.firstName} is in the system.
          </p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Take their measurements next — everything else builds on top of them.
          </p>
          {tenant.can("measurement:write") ? (
            <Button asChild variant="primary" size="sm" className="mt-3.5">
              <Link href={`/app/customers/${customer.id}/measure`}>
                <Ruler />
                Take measurements
              </Link>
            </Button>
          ) : null}
        </div>
      ) : fitMemory.welcomeBack ? (
        <WelcomeBack
          name={customer.firstName}
          sentence={fitMemory.welcomeBack.sentence}
        />
      ) : null}

      <TabBar
        tabs={[
          { value: "overview", label: "Overview" },
          {
            value: "measurements",
            label: "Measurements",
            count: customer._count.measurementSets,
          },
          { value: "orders", label: "Orders", count: customer._count.orders },
          { value: "styles", label: "Styles" },
          { value: "photos", label: "Photos", count: customer._count.photos },
          { value: "payments", label: "Payments", count: customer._count.payments },
          { value: "notes", label: "Notes" },
        ]}
      />

      <div className="pt-6">
        {tab === "overview" ? (
          <OverviewTab
            profile={profile}
            currency={tenant.business.currency}
            canMeasure={tenant.can("measurement:write")}
            canOrder={tenant.can("order:write")}
          />
        ) : null}

        {tab === "measurements" ? (
          <MeasurementsTab
            businessId={tenant.businessId}
            customerId={customer.id}
            canMeasure={tenant.can("measurement:write")}
          />
        ) : null}

        {tab === "orders" ? (
          <OrdersTab
            orders={orders}
            customerId={customer.id}
            currency={tenant.business.currency}
            canOrder={tenant.can("order:write")}
          />
        ) : null}

        {tab === "styles" ? (
          <StylesTab profile={profile} canEdit={tenant.can("style:write")} />
        ) : null}

        {tab === "photos" ? (
          <PhotosTab
            businessId={tenant.businessId}
            customerId={customer.id}
            canUpload={tenant.can("photo:write")}
            canDelete={tenant.can("photo:delete")}
            canSetProfile={tenant.can("customer:write")}
          />
        ) : null}

        {tab === "payments" ? (
          <PaymentsTab
            businessId={tenant.businessId}
            customerId={customer.id}
            currency={tenant.business.currency}
            outstandingMinor={outstandingMinor}
            totalPaidMinor={totalPaidMinor}
            canRecord={tenant.can("payment:write")}
          />
        ) : null}

        {tab === "notes" ? (
          <NotesTab
            customerId={customer.id}
            notes={customer.notes}
            canEdit={tenant.can("customer:write")}
          />
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

async function OverviewTab({
  profile,
  currency,
  canMeasure,
  canOrder,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;
  currency: string;
  canMeasure: boolean;
  canOrder: boolean;
}) {
  const { customer, orders, fitMemory, lastMeasurement, outstandingMinor } = profile;
  const activeOrders = orders.filter(
    (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
  );

  return (
    <div className="space-y-6">
      <FitMemoryPanel memory={fitMemory} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>In progress</CardTitle>
              <CardDescription>
                {activeOrders.length > 0
                  ? `${pluralise(activeOrders.length, "outfit")} on the bench.`
                  : "Nothing being made right now."}
              </CardDescription>
            </div>
            {canOrder ? (
              <Button asChild variant="outline" size="xs">
                <Link href={`/app/orders/new?customer=${customer.id}`}>
                  <Plus />
                  New order
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="pb-4">
            {activeOrders.length === 0 ? (
              <EmptyState
                compact
                icon={Package}
                title="No live orders."
                message={`When ${customer.firstName} orders something, its progress shows up here.`}
              />
            ) : (
              <ul className="divide-y divide-border">
                {activeOrders.map((order) => {
                  const deadline = describeDeadline(order.deliveryDate);
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/app/orders/${order.id}`}
                        className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-muted/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {order.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            #{order.code} ·{" "}
                            {labelFor(OUTFIT_TYPE_META, order.outfitType)}
                            {order.fabric ? ` · ${order.fabric}` : ""}
                          </p>
                          <div className="mt-2 h-1 w-full max-w-48 overflow-hidden rounded-full bg-surface-muted">
                            <div
                              className="h-full rounded-full bg-ink-900 dark:bg-accent"
                              style={{ width: `${orderProgress(order.status)}%` }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge size="sm" tone={toneFor(ORDER_STATUS_META, order.status)}>
                            {labelFor(ORDER_STATUS_META, order.status)}
                          </Badge>
                          <p
                            className={`mt-1.5 text-[0.6875rem] font-medium ${
                              deadline.tone === "critical"
                                ? "text-critical"
                                : deadline.tone === "caution"
                                  ? "text-caution"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {deadline.text}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <DataPoint label="Phone" value={customer.phone} />
                {customer.altPhone ? (
                  <DataPoint label="Second phone" value={customer.altPhone} />
                ) : null}
                {customer.email ? (
                  <DataPoint
                    label="Email"
                    value={customer.email}
                    className="col-span-2"
                  />
                ) : null}
                {customer.addressLine || customer.city ? (
                  <DataPoint
                    label="Address"
                    value={[customer.addressLine, customer.city]
                      .filter(Boolean)
                      .join(", ")}
                    className="col-span-2"
                  />
                ) : null}
                {customer.birthday ? (
                  <DataPoint
                    label="Birthday"
                    value={formatFriendlyDate(customer.birthday)}
                  />
                ) : null}
                <DataPoint
                  label="Added by"
                  value={customer.createdBy?.name ?? "—"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Money</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <DataPoint
                  label="Paid to date"
                  value={formatMoney(profile.totalPaidMinor, currency)}
                  emphasis
                />
                <DataPoint
                  label="Outstanding"
                  value={
                    outstandingMinor > 0 ? (
                      <span className="text-caution">
                        {formatMoney(outstandingMinor, currency)}
                      </span>
                    ) : (
                      "Nothing owed"
                    )
                  }
                  emphasis
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Latest measurements</CardTitle>
                <CardDescription>
                  {lastMeasurement
                    ? `Taken ${formatLongDate(lastMeasurement.measuredAt)}`
                    : "Not measured yet"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {lastMeasurement ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/app/customers/${customer.id}?tab=measurements`}>
                    <Ruler />
                    View measurement history
                  </Link>
                </Button>
              ) : canMeasure ? (
                <Button asChild variant="primary" size="sm" className="w-full">
                  <Link href={`/app/customers/${customer.id}/measure`}>
                    <Ruler />
                    Take measurements
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No measurements on record.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

async function MeasurementsTab({
  businessId,
  customerId,
  canMeasure,
}: {
  businessId: string;
  customerId: string;
  canMeasure: boolean;
}) {
  const history = await getMeasurementHistory(businessId, customerId);

  if (history.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Ruler}
          title="No measurements yet."
          message="Measure once and it is remembered forever. Every future session is added on top rather than replacing what came before, so you can always see how a body has changed."
          action={
            canMeasure ? (
              <Button asChild variant="primary">
                <Link href={`/app/customers/${customerId}/measure`}>
                  <Ruler />
                  Take measurements
                </Link>
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  const [latest, ...older] = history;
  const groups = MEASUREMENT_GROUPS.filter((group) =>
    latest!.values.some((value) => value.group === group),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pluralise(history.length, "measurement session")} on record. The newest
          is shown first.
        </p>
        <div className="flex items-center gap-2">
          {history.length > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/customers/${customerId}/measurements/compare`}>
                Compare
              </Link>
            </Button>
          ) : null}
          {canMeasure ? (
            <Button asChild variant="primary" size="sm">
              <Link href={`/app/customers/${customerId}/measure`}>
                <Plus />
                New session
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Current measurements</CardTitle>
            <CardDescription>
              Taken {formatLongDate(latest!.measuredAt)} by {latest!.measuredByName}
            </CardDescription>
          </div>
          <Badge tone="accent">{latest!.unit}</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="eyebrow mb-3 text-subtle-foreground">
                {labelFor(MEASUREMENT_GROUP_META, group)}
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
                {latest!.values
                  .filter((value) => value.group === group)
                  .map((value) => (
                    <div key={value.fieldKey}>
                      <dt className="text-xs text-muted-foreground">
                        {value.fieldLabel}
                      </dt>
                      <dd className="tabular mt-1 text-lg font-semibold text-foreground">
                        {tenthsToDisplay(value.valueTenths)}
                        <span className="ml-1 text-xs font-normal text-subtle-foreground">
                          {value.unit}
                        </span>
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}

          {latest!.notes ? (
            <p className="rounded-lg bg-surface-muted/60 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {latest!.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {older.length > 0 ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Nothing here is ever overwritten.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="divide-y divide-border">
              {older.map((set) => (
                <li key={set.id} className="py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {formatLongDate(set.measuredAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {set.measuredByName} · {timeAgo(set.measuredAt)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                    {set.values.map((value) => (
                      <span
                        key={value.fieldKey}
                        className="text-xs text-muted-foreground"
                      >
                        {value.fieldLabel}{" "}
                        <span className="tabular font-medium text-foreground">
                          {tenthsToDisplay(value.valueTenths)}
                          {value.unit}
                        </span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function OrdersTab({
  orders,
  customerId,
  currency,
  canOrder,
}: {
  orders: NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>["orders"];
  customerId: string;
  currency: string;
  canOrder: boolean;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Package}
          title="No orders yet."
          message="Start an order and every stage — cutting, sewing, fitting, delivery — is tracked against this customer."
          action={
            canOrder ? (
              <Button asChild variant="primary">
                <Link href={`/app/orders/new?customer=${customerId}`}>
                  <Plus />
                  New order
                </Link>
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pluralise(orders.length, "order")}, newest first.
        </p>
        {canOrder ? (
          <Button asChild variant="primary" size="sm">
            <Link href={`/app/orders/new?customer=${customerId}`}>
              <Plus />
              New order
            </Link>
          </Button>
        ) : null}
      </div>

      <TableShell>
        <Table>
          <THead>
            <tr>
              <TH>Outfit</TH>
              <TH>Status</TH>
              <TH>Delivery</TH>
              <TH align="right">Price</TH>
              <TH align="right">Balance</TH>
            </tr>
          </THead>
          <TBody>
            {orders.map((order) => (
              <TR key={order.id} className="group">
                <TD>
                  <Link href={`/app/orders/${order.id}`} className="block min-w-0">
                    <span className="block truncate font-medium group-hover:underline group-hover:decoration-border-strong group-hover:underline-offset-2">
                      {order.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      #{order.code} · {formatShortDate(order.createdAt)}
                      {order.fabric ? ` · ${order.fabric}` : ""}
                    </span>
                  </Link>
                </TD>
                <TD>
                  <Badge size="sm" tone={toneFor(ORDER_STATUS_META, order.status)}>
                    {labelFor(ORDER_STATUS_META, order.status)}
                  </Badge>
                </TD>
                <TD className="text-muted-foreground">
                  {order.deliveryDate ? formatShortDate(order.deliveryDate) : "—"}
                </TD>
                <TD align="right">{formatMoney(order.priceMinor, currency)}</TD>
                <TD align="right">
                  {order.balanceMinor > 0 ? (
                    <span className="font-medium text-caution">
                      {formatMoney(order.balanceMinor, currency)}
                    </span>
                  ) : (
                    <span className="text-positive">Paid</span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableShell>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function StylesTab({
  profile,
  canEdit,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;
  canEdit: boolean;
}) {
  const { customer } = profile;
  const styleProfile = customer.styleProfile;
  const preferences = customer.stylePreferences;

  const styles = preferences.filter((entry) => entry.kind === "STYLE");
  const colours = preferences.filter((entry) => entry.kind === "COLOR");
  const fabrics = preferences.filter((entry) => entry.kind === "FABRIC");

  const isEmpty =
    !styleProfile?.preferredFit &&
    !styleProfile?.styleNotes &&
    preferences.length === 0;

  if (isEmpty) {
    return (
      <Card>
        <EmptyState
          icon={Palette}
          title="No style profile yet."
          message={`Record how ${customer.firstName} likes to dress — the fit, the colours, the fabrics — and you will never have to ask twice.`}
          action={
            canEdit ? (
              <Button asChild variant="primary">
                <Link href={`/app/customers/${customer.id}/styles`}>
                  <Palette />
                  Build style profile
                </Link>
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          What works for {customer.firstName}, so you never guess.
        </p>
        {canEdit ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/customers/${customer.id}/styles`}>Edit profile</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Fit and silhouette</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <DataPoint
              label="Preferred fit"
              value={
                styleProfile?.preferredFit
                  ? labelFor(PREFERRED_FIT_META, styleProfile.preferredFit)
                  : "Not recorded"
              }
            />

            {styles.length > 0 ? (
              <div>
                <p className="eyebrow mb-2.5 text-subtle-foreground">Styles</p>
                <div className="flex flex-wrap gap-1.5">
                  {styles.map((entry) => (
                    <Badge key={entry.id} tone="neutral">
                      {labelFor(STYLE_PREFERENCE_META, entry.value)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Colours and fabrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {colours.length > 0 ? (
              <div>
                <p className="eyebrow mb-2.5 text-subtle-foreground">Colours</p>
                <div className="flex flex-wrap gap-2">
                  {colours.map((entry) => {
                    const known = COLOR_PREFERENCES.find(
                      (colour) => colour.value === entry.value,
                    );
                    return (
                      <span
                        key={entry.id}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
                      >
                        <span
                          aria-hidden
                          className="size-3 rounded-full border border-black/10"
                          style={{ backgroundColor: colorHex(entry.value) }}
                        />
                        {known?.label ?? entry.value}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {fabrics.length > 0 ? (
              <div>
                <p className="eyebrow mb-2.5 text-subtle-foreground">Fabrics</p>
                <div className="flex flex-wrap gap-1.5">
                  {fabrics.map((entry) => (
                    <Badge key={entry.id} tone="accent">
                      {labelFor(FABRIC_PREFERENCE_META, entry.value)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {styleProfile?.styleNotes ||
      styleProfile?.avoidNotes ||
      styleProfile?.occasionNotes ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Notes on styling</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-3">
            {styleProfile.styleNotes ? (
              <div>
                <p className="eyebrow mb-2 text-subtle-foreground">What works</p>
                <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {styleProfile.styleNotes}
                </p>
              </div>
            ) : null}
            {styleProfile.avoidNotes ? (
              <div>
                <p className="eyebrow mb-2 text-subtle-foreground">Avoid</p>
                <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {styleProfile.avoidNotes}
                </p>
              </div>
            ) : null}
            {styleProfile.occasionNotes ? (
              <div>
                <p className="eyebrow mb-2 text-subtle-foreground">Usually for</p>
                <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {styleProfile.occasionNotes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

async function PhotosTab({
  businessId,
  customerId,
  canUpload,
  canDelete,
  canSetProfile,
}: {
  businessId: string;
  customerId: string;
  canUpload: boolean;
  canDelete: boolean;
  canSetProfile: boolean;
}) {
  const photos = await prisma.customerPhoto.findMany({
    where: { businessId, customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      caption: true,
      storageKey: true,
      createdAt: true,
      fileName: true,
      order: { select: { id: true, code: true, title: true } },
    },
  });

  if (photos.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Images}
          title="No photos yet."
          message="Reference pictures, fabric shots and finished outfits all belong here. It becomes the visual history of everything you have made for this customer."
          action={
            canUpload ? (
              <Button asChild variant="primary">
                <Link href={`/app/customers/${customerId}/photos`}>
                  <Plus />
                  Add photos
                </Link>
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  const byCategory = new Map<string, typeof photos>();
  for (const photo of photos) {
    const list = byCategory.get(photo.category) ?? [];
    list.push(photo);
    byCategory.set(photo.category, list);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {pluralise(photos.length, "photo")} across{" "}
          {pluralise(byCategory.size, "category", "categories")}.
        </p>
        {canUpload ? (
          <Button asChild variant="primary" size="sm">
            <Link href={`/app/customers/${customerId}/photos`}>
              <Plus />
              Add photos
            </Link>
          </Button>
        ) : null}
      </div>

      {[...byCategory.entries()].map(([category, items]) => (
        <section key={category}>
          <h3 className="eyebrow mb-3 text-subtle-foreground">
            {labelFor(PHOTO_CATEGORY_META, category)}
          </h3>
          <PhotoGallery
            photos={items}
            canDelete={canDelete}
            canSetProfile={canSetProfile}
          />
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

async function PaymentsTab({
  businessId,
  customerId,
  currency,
  outstandingMinor,
  totalPaidMinor,
  canRecord,
}: {
  businessId: string;
  customerId: string;
  currency: string;
  outstandingMinor: number;
  totalPaidMinor: number;
  canRecord: boolean;
}) {
  const payments = await prisma.payment.findMany({
    where: { businessId, customerId },
    orderBy: { receivedAt: "desc" },
    select: {
      id: true,
      amountMinor: true,
      method: true,
      reference: true,
      receiptNumber: true,
      receivedAt: true,
      note: true,
      order: { select: { id: true, code: true, title: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="px-5 py-5">
          <p className="eyebrow text-subtle-foreground">Paid to date</p>
          <p className="tabular mt-3 text-2xl font-semibold tracking-tight">
            {formatMoney(totalPaidMinor, currency)}
          </p>
        </Card>
        <Card className="px-5 py-5">
          <p className="eyebrow text-subtle-foreground">Outstanding</p>
          <p
            className={`tabular mt-3 text-2xl font-semibold tracking-tight ${
              outstandingMinor > 0 ? "text-caution" : "text-positive"
            }`}
          >
            {formatMoney(outstandingMinor, currency)}
          </p>
        </Card>
        <Card className="flex flex-col justify-center px-5 py-5">
          {canRecord ? (
            <Button asChild variant="primary" size="sm">
              <Link href={`/app/payments/new?customer=${customerId}`}>
                <CreditCard />
                Record a payment
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to record payments.
            </p>
          )}
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="No payments recorded."
            message="Every deposit, instalment and final settlement gets a receipt number here."
            action={
              canRecord ? (
                <Button asChild variant="primary" size="sm">
                  <Link href={`/app/payments/new?customer=${customerId}`}>
                    <Plus />
                    Record a payment
                  </Link>
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <TableShell>
          <Table>
            <THead>
              <tr>
                <TH>Receipt</TH>
                <TH>Order</TH>
                <TH>Method</TH>
                <TH>Date</TH>
                <TH align="right">Amount</TH>
              </tr>
            </THead>
            <TBody>
              {payments.map((payment) => (
                <TR key={payment.id}>
                  <TD className="tabular">
                    <Link
                      href={`/app/payments/${payment.id}`}
                      className="font-medium hover:underline hover:decoration-border-strong hover:underline-offset-2"
                    >
                      {payment.receiptNumber}
                    </Link>
                  </TD>
                  <TD>
                    {payment.order ? (
                      <Link
                        href={`/app/orders/${payment.order.id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {payment.order.title}
                      </Link>
                    ) : (
                      <span className="text-subtle-foreground">—</span>
                    )}
                  </TD>
                  <TD>
                    <Badge size="sm" tone={toneFor(PAYMENT_METHOD_META, payment.method)}>
                      {labelFor(PAYMENT_METHOD_META, payment.method)}
                    </Badge>
                  </TD>
                  <TD className="text-muted-foreground">
                    {formatShortDate(payment.receivedAt)}
                  </TD>
                  <TD align="right" className="font-medium">
                    {formatMoney(payment.amountMinor, currency)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableShell>
      )}
    </div>
  );
}
