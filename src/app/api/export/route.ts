import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { requireTenant, audit } from "@/lib/tenant";
import { minorToMajor } from "@/lib/money";

/**
 * Data portability, taken seriously.
 *
 * A tailor's customer book is theirs. `format=json` hands back the whole
 * business in one file; `format=csv` hands back one table in a shape that
 * opens in Excel, because that is what a real handover looks like.
 */

const TABLES = ["customers", "orders", "payments", "measurements"] as const;
type Table = (typeof TABLES)[number];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  // A BOM so Excel on Windows reads the accented names correctly.
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

export async function GET(request: NextRequest) {
  const tenant = await requireTenant();
  if (!tenant.can("settings:read")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const businessId = tenant.businessId;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = tenant.business.slug;

  if (format === "csv") {
    const requested = url.searchParams.get("table") ?? "customers";
    const table = (TABLES as readonly string[]).includes(requested)
      ? (requested as Table)
      : "customers";

    const { rows, headers } = await csvTable(businessId, table);

    await audit(tenant, {
      action: "data.exported",
      entityType: "Business",
      entityId: businessId,
      summary: `Exported ${table} as CSV`,
    });

    return new NextResponse(toCsv(rows, headers), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${slug}-${table}-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  const [business, customers, orders, payments, styleLibrary, appointments] =
    await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: { settings: true },
      }),
      prisma.customer.findMany({
        where: { businessId },
        orderBy: { createdAt: "asc" },
        include: {
          tags: { select: { label: true } },
          styleProfile: true,
          stylePreferences: true,
          measurementSets: {
            orderBy: { measuredAt: "asc" },
            include: { values: true },
          },
          photos: {
            select: {
              id: true,
              category: true,
              caption: true,
              storageKey: true,
              fileName: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: "asc" },
        include: {
          items: true,
          timeline: { orderBy: { occurredAt: "asc" } },
          fittings: true,
        },
      }),
      prisma.payment.findMany({
        where: { businessId },
        orderBy: { receivedAt: "asc" },
      }),
      prisma.styleLibraryItem.findMany({ where: { businessId } }),
      prisma.appointment.findMany({ where: { businessId } }),
    ]);

  await audit(tenant, {
    action: "data.exported",
    entityType: "Business",
    entityId: businessId,
    summary: "Exported the full business as JSON",
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: tenant.user.email,
    format: "fit-by-you/v1",
    note:
      "Money values are whole minor units of the business currency (for GHS, pesewas). " +
      "Measurement values are tenths of the stated unit.",
    business,
    customers,
    orders,
    payments,
    styleLibrary,
    appointments,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}-everything-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}

async function csvTable(
  businessId: string,
  table: Table,
): Promise<{ rows: Record<string, unknown>[]; headers: string[] }> {
  if (table === "customers") {
    const [customers, totals] = await Promise.all([
      prisma.customer.findMany({
        where: { businessId },
        orderBy: { code: "asc" },
        include: { tags: { select: { label: true } } },
      }),
      prisma.order.groupBy({
        by: ["customerId"],
        where: { businessId, status: { not: "CANCELLED" } },
        _count: { _all: true },
        _sum: { paidMinor: true, balanceMinor: true },
      }),
    ]);

    const byCustomer = new Map(totals.map((row) => [row.customerId, row]));

    return {
      headers: [
        "code",
        "first_name",
        "last_name",
        "phone",
        "alt_phone",
        "email",
        "gender",
        "city",
        "address",
        "birthday",
        "tags",
        "customer_since",
        "total_orders",
        "total_spent",
        "outstanding",
        "notes",
      ],
      rows: customers.map((customer) => {
        const totals = byCustomer.get(customer.id);
        return {
          code: customer.code,
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          alt_phone: customer.altPhone,
          email: customer.email,
          gender: customer.gender,
          city: customer.city,
          address: customer.addressLine,
          birthday: customer.birthday?.toISOString().slice(0, 10),
          tags: customer.tags.map((tag) => tag.label).join(" | "),
          customer_since: customer.customerSince.toISOString().slice(0, 10),
          total_orders: totals?._count._all ?? 0,
          total_spent: minorToMajor(totals?._sum.paidMinor ?? 0).toFixed(2),
          outstanding: minorToMajor(totals?._sum.balanceMinor ?? 0).toFixed(2),
          notes: customer.notes,
        };
      }),
    };
  }

  if (table === "orders") {
    const orders = await prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" },
      include: { customer: { select: { code: true, fullName: true } } },
    });

    return {
      headers: [
        "code",
        "customer_code",
        "customer",
        "title",
        "outfit_type",
        "status",
        "priority",
        "fabric",
        "ordered",
        "due",
        "delivered",
        "price",
        "paid",
        "balance",
        "notes",
      ],
      rows: orders.map((order) => ({
        code: order.code,
        customer_code: order.customer.code,
        customer: order.customer.fullName,
        title: order.title,
        outfit_type: order.outfitType,
        status: order.status,
        priority: order.priority,
        fabric: order.fabric,
        ordered: order.createdAt.toISOString().slice(0, 10),
        due: order.deliveryDate?.toISOString().slice(0, 10),
        delivered: order.deliveredAt?.toISOString().slice(0, 10),
        price: minorToMajor(order.priceMinor).toFixed(2),
        paid: minorToMajor(order.paidMinor).toFixed(2),
        balance: minorToMajor(order.balanceMinor).toFixed(2),
        notes: order.notes,
      })),
    };
  }

  if (table === "payments") {
    const payments = await prisma.payment.findMany({
      where: { businessId },
      orderBy: { receivedAt: "asc" },
      include: {
        customer: { select: { code: true, fullName: true } },
        order: { select: { code: true, title: true } },
        recordedBy: { select: { name: true } },
      },
    });

    return {
      headers: [
        "receipt",
        "received",
        "customer_code",
        "customer",
        "order_code",
        "order",
        "method",
        "amount",
        "reference",
        "recorded_by",
        "note",
      ],
      rows: payments.map((payment) => ({
        receipt: payment.receiptNumber,
        received: payment.receivedAt.toISOString(),
        customer_code: payment.customer.code,
        customer: payment.customer.fullName,
        order_code: payment.order?.code,
        order: payment.order?.title,
        method: payment.method,
        amount: minorToMajor(payment.amountMinor).toFixed(2),
        reference: payment.reference,
        recorded_by: payment.recordedBy?.name,
        note: payment.note,
      })),
    };
  }

  // One row per measurement taken, which is the shape that lets someone chart
  // a single customer's waist over two years in a spreadsheet.
  const values = await prisma.measurementValue.findMany({
    where: { businessId },
    orderBy: [{ set: { measuredAt: "asc" } }, { fieldKey: "asc" }],
    include: {
      set: {
        select: {
          measuredAt: true,
          measuredByName: true,
          notes: true,
          customer: { select: { code: true, fullName: true } },
        },
      },
    },
  });

  return {
    headers: [
      "measured_at",
      "customer_code",
      "customer",
      "field",
      "value",
      "unit",
      "measured_by",
      "session_notes",
    ],
    rows: values.map((value) => ({
      measured_at: value.set.measuredAt.toISOString(),
      customer_code: value.set.customer.code,
      customer: value.set.customer.fullName,
      field: value.fieldLabel,
      value: (value.valueTenths / 10).toFixed(1),
      unit: value.unit,
      measured_by: value.set.measuredByName,
      session_notes: value.set.notes,
    })),
  };
}
