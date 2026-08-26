import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { requireTenant } from "@/lib/tenant";

/**
 * The customer QR code.
 *
 * A tailor prints these onto a card the customer keeps in their purse. Scanning
 * it opens that customer's profile instantly, which is the fastest possible
 * version of "find me in the system".
 *
 * The code is generated on demand rather than stored: it is derived entirely
 * from the customer id, and rendering it costs less than a round trip to
 * storage would.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const tenant = await requireTenant();
  const { customerId } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId: tenant.businessId },
    select: { id: true, code: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const base = getAppUrl();
  const target = `${base}/app/customers/${customer.id}`;

  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#08080a", light: "#00000000" },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      // Private: the URL identifies a customer, so no shared cache may keep it.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
