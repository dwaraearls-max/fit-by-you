"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";

export async function markNotificationsReadAction(): Promise<void> {
  const tenant = await requireTenant();

  await prisma.notification.updateMany({
    where: { businessId: tenant.businessId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/app", "layout");
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const tenant = await requireTenant();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await prisma.notification.updateMany({
    where: { id, businessId: tenant.businessId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/app", "layout");
}
