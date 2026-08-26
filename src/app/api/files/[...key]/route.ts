import { NextResponse } from "next/server";

import { requireTenant } from "@/lib/tenant";
import { businessIdFromKey, etagFor, isSafeKey, storage } from "@/lib/storage";

/**
 * The authorizing image proxy.
 *
 * Uploaded photos are never served from a public directory. Every request
 * arrives here, gets a session, and only then is the object read — and only if
 * the key belongs to the business the caller is signed in to. A customer's
 * fitting photos are as private as their measurements.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const tenant = await requireTenant();
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!isSafeKey(key)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (businessIdFromKey(key) !== tenant.businessId) {
    // Deliberately a 404 rather than a 403: whether an object exists in another
    // business is itself information this caller has no right to.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const object = await storage().get(key);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const etag = etagFor(object.bytes);
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(new Uint8Array(object.bytes), {
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.size),
      ETag: etag,
      // Private: the URL identifies one business's customer photo, so no shared
      // cache may keep a copy. Immutable because keys are never reused.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
