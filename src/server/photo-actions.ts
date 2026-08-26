"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit, requirePermission } from "@/lib/tenant";
import { photoCategorySchema, styleCategorySchema } from "@/lib/domain";
import {
  MAX_UPLOAD_BYTES,
  buildKey,
  isAllowedImageType,
  storage,
} from "@/lib/storage";
import { addTimelineEvent } from "@/server/services/orders";
import {
  fail,
  getOptionalString,
  getString,
  guarded,
  succeed,
  type FormState,
} from "@/server/form";

/**
 * Photo upload.
 *
 * Files come in through a Server Action rather than a public endpoint, so the
 * permission check, the tenant prefix on the key and the database row are all
 * decided in one place. Nothing is written to storage until we know who is
 * asking and where the object belongs.
 */
export async function uploadPhotosAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("photo:write");

    const customerId = getString(formData, "customerId");
    if (!customerId) return fail("Missing customer.");

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId: tenant.businessId },
      select: { id: true, firstName: true },
    });
    if (!customer) return fail("That customer is not in your records.");

    const categoryResult = photoCategorySchema.safeParse(
      getString(formData, "category") || "REFERENCE",
    );
    const category = categoryResult.success ? categoryResult.data : "REFERENCE";

    const orderId = getOptionalString(formData, "orderId");
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, businessId: tenant.businessId, customerId },
        select: { id: true },
      });
      if (!order) {
        return fail("That outfit does not belong to this customer.", {
          orderId: "Pick one of this customer's outfits.",
        });
      }
    }

    const caption = getOptionalString(formData, "caption");
    const files = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      return fail("Choose a photo, or take one with the camera.");
    }
    if (files.length > 12) {
      return fail("Twelve photos at a time is the limit. Do the rest in a second batch.");
    }

    for (const file of files) {
      if (!isAllowedImageType(file.type)) {
        return fail(
          `“${file.name}” is not an image FIT BY YOU can read. JPEG, PNG, WebP or HEIC all work.`,
        );
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return fail(
          `“${file.name}” is larger than 8 MB. Most phones have a setting to take smaller pictures.`,
        );
      }
    }

    const store = storage();
    const created: string[] = [];

    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const key = buildKey({
        businessId: tenant.businessId,
        scope: "customers",
        ownerId: customer.id,
        mimeType: file.type,
      });

      await store.put({ key, bytes, contentType: file.type });

      const photo = await prisma.customerPhoto.create({
        data: {
          businessId: tenant.businessId,
          customerId: customer.id,
          orderId: orderId || null,
          category,
          storageKey: key,
          fileName: file.name.slice(0, 200),
          mimeType: file.type,
          sizeBytes: bytes.byteLength,
          caption: caption || null,
          uploadedById: tenant.user.id,
        },
        select: { id: true },
      });

      created.push(photo.id);
    }

    if (orderId) {
      await addTimelineEvent(tenant, orderId, {
        type: "PHOTO_ADDED",
        title: files.length === 1 ? "Photo added" : `${files.length} photos added`,
        description: caption ?? null,
      });
      revalidatePath(`/app/orders/${orderId}`);
    }

    await audit(tenant, {
      action: "photo.uploaded",
      entityType: "customer",
      entityId: customer.id,
      summary: `Added ${created.length === 1 ? "a photo" : `${created.length} photos`} to ${customer.firstName}'s record.`,
    });

    revalidatePath(`/app/customers/${customer.id}`);
    revalidatePath(`/app/customers/${customer.id}/photos`);

    return succeed(
      files.length === 1
        ? "Photo saved."
        : `${files.length} photos saved.`,
    );
  });
}

export async function updatePhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("photo:write");
    const photoId = getString(formData, "photoId");
    if (!photoId) return fail("Missing photo.");

    const photo = await prisma.customerPhoto.findFirst({
      where: { id: photoId, businessId: tenant.businessId },
      select: { id: true, customerId: true },
    });
    if (!photo) return fail("That photo is no longer here.");

    const categoryResult = photoCategorySchema.safeParse(
      getString(formData, "category"),
    );

    await prisma.customerPhoto.update({
      where: { id: photoId, businessId: tenant.businessId },
      data: {
        caption: getOptionalString(formData, "caption"),
        ...(categoryResult.success ? { category: categoryResult.data } : {}),
      },
    });

    revalidatePath(`/app/customers/${photo.customerId}`);
    revalidatePath(`/app/customers/${photo.customerId}/photos`);

    return succeed("Photo updated.");
  });
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("photo:delete");
  const photoId = getString(formData, "photoId");
  if (!photoId) return;

  const photo = await prisma.customerPhoto.findFirst({
    where: { id: photoId, businessId: tenant.businessId },
    select: { id: true, customerId: true, orderId: true, storageKey: true },
  });
  if (!photo) return;

  await prisma.customerPhoto.delete({
    where: { id: photoId, businessId: tenant.businessId },
  });

  // The row is the record of truth; a stranded object would be a privacy leak
  // waiting to happen, so the file goes too.
  await storage().remove(photo.storageKey);

  await audit(tenant, {
    action: "photo.deleted",
    entityType: "customer",
    entityId: photo.customerId,
    summary: "Removed a photo.",
  });

  revalidatePath(`/app/customers/${photo.customerId}`);
  revalidatePath(`/app/customers/${photo.customerId}/photos`);
  if (photo.orderId) revalidatePath(`/app/orders/${photo.orderId}`);
}

/** Uses one of the customer's photos as their profile picture. */
export async function setCustomerPhotoAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("customer:write");
  const photoId = getString(formData, "photoId");
  if (!photoId) return;

  const photo = await prisma.customerPhoto.findFirst({
    where: { id: photoId, businessId: tenant.businessId },
    select: { customerId: true, storageKey: true },
  });
  if (!photo) return;

  await prisma.customer.update({
    where: { id: photo.customerId, businessId: tenant.businessId },
    data: { photoKey: photo.storageKey },
  });

  revalidatePath(`/app/customers/${photo.customerId}`);
  revalidatePath("/app/customers");
}

// ---------------------------------------------------------------------------
// Style library
// ---------------------------------------------------------------------------

const styleItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give the style a name.")
    .max(120, "Keep the name shorter."),
  category: styleCategorySchema,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  externalUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "Links need to start with http:// or https://",
    ),
  customerId: z.string().trim().optional().or(z.literal("")),
});

export async function addStyleItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const tenant = await requirePermission("style:write");

    const parsed = styleItemSchema.safeParse({
      title: getString(formData, "title"),
      category: getString(formData, "category") || "DRESSES",
      notes: getString(formData, "notes"),
      externalUrl: getString(formData, "externalUrl"),
      customerId: getString(formData, "customerId"),
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(issue?.message ?? "Please check the form.", {
        [issue?.path.join(".") ?? "title"]: issue?.message ?? "Invalid value.",
      });
    }

    const data = parsed.data;

    const file = formData.get("image");
    let storageKey: string | null = null;

    if (file instanceof File && file.size > 0) {
      if (!isAllowedImageType(file.type)) {
        return fail("That file is not an image FIT BY YOU can read.");
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return fail("That image is larger than 8 MB.");
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const key = buildKey({
        businessId: tenant.businessId,
        scope: "styles",
        mimeType: file.type,
      });
      await storage().put({ key, bytes, contentType: file.type });
      storageKey = key;
    }

    if (!storageKey && !data.externalUrl) {
      return fail("Add a picture or a link, so there is something to look at.");
    }

    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, businessId: tenant.businessId },
        select: { id: true },
      });
      if (!customer) {
        return fail("That customer is not in your records.", {
          customerId: "Pick a customer from your list.",
        });
      }
    }

    await prisma.styleLibraryItem.create({
      data: {
        businessId: tenant.businessId,
        title: data.title,
        category: data.category,
        notes: data.notes || null,
        externalUrl: data.externalUrl || null,
        storageKey,
        customerId: data.customerId || null,
        createdById: tenant.user.id,
      },
    });

    await audit(tenant, {
      action: "style.created",
      entityType: "style_library_item",
      summary: `Added "${data.title}" to the style library.`,
    });

    revalidatePath("/app/styles");

    return succeed(`"${data.title}" is in your library.`);
  });
}

export async function deleteStyleItemAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("style:write");
  const itemId = getString(formData, "itemId");
  if (!itemId) return;

  const item = await prisma.styleLibraryItem.findFirst({
    where: { id: itemId, businessId: tenant.businessId },
    select: { id: true, title: true, storageKey: true },
  });
  if (!item) return;

  await prisma.styleLibraryItem.delete({
    where: { id: itemId, businessId: tenant.businessId },
  });

  if (item.storageKey) await storage().remove(item.storageKey);

  await audit(tenant, {
    action: "style.deleted",
    entityType: "style_library_item",
    entityId: itemId,
    summary: `Removed "${item.title}" from the style library.`,
  });

  revalidatePath("/app/styles");
}
