import "server-only";

import { prisma } from "@/lib/db";
import {
  customerSearchText,
  nextCustomerCode,
} from "@/lib/codes";
import { normalisePhone } from "@/lib/utils";
import { audit, notify, type TenantContext } from "@/lib/tenant";

export type CustomerInput = {
  firstName: string;
  lastName: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  gender?: string;
  city?: string | null;
  addressLine?: string | null;
  birthday?: Date | null;
  notes?: string | null;
  tags?: string[];
};

/**
 * Creates a customer along with the empty style profile that every customer
 * needs, so no screen ever has to handle a missing profile.
 */
export async function createCustomer(
  tenant: Pick<TenantContext, "businessId" | "business" | "user">,
  input: CustomerInput,
) {
  const code = await nextCustomerCode(tenant.businessId, tenant.business.name);
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const phone = normalisePhone(input.phone);

  const customer = await prisma.customer.create({
    data: {
      businessId: tenant.businessId,
      code,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName,
      phone,
      altPhone: input.altPhone ? normalisePhone(input.altPhone) : null,
      email: input.email ?? null,
      gender: input.gender ?? "UNSPECIFIED",
      city: input.city ?? null,
      addressLine: input.addressLine ?? null,
      birthday: input.birthday ?? null,
      notes: input.notes ?? null,
      createdById: tenant.user.id,
      searchText: customerSearchText({
        fullName,
        phone,
        code,
        email: input.email,
        city: input.city,
      }),
      styleProfile: {
        create: { businessId: tenant.businessId },
      },
      tags: {
        create: (input.tags?.length ? input.tags : ["NEW"]).map((label) => ({
          businessId: tenant.businessId,
          label,
        })),
      },
    },
  });

  await audit(tenant, {
    action: "customer.created",
    entityType: "customer",
    entityId: customer.id,
    summary: `Added ${fullName} (${code}).`,
  });

  await notify(tenant.businessId, {
    type: "NEW_CUSTOMER",
    title: "New customer added",
    body: `${fullName} was added to your customer list.`,
    entityType: "customer",
    entityId: customer.id,
  });

  return customer;
}

export async function updateCustomer(
  tenant: Pick<TenantContext, "businessId" | "user">,
  customerId: string,
  input: CustomerInput,
) {
  const existing = await prisma.customer.findFirstOrThrow({
    where: { id: customerId, businessId: tenant.businessId },
    select: { code: true },
  });

  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const phone = normalisePhone(input.phone);

  const customer = await prisma.customer.update({
    where: { id: customerId, businessId: tenant.businessId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      fullName,
      phone,
      altPhone: input.altPhone ? normalisePhone(input.altPhone) : null,
      email: input.email ?? null,
      gender: input.gender ?? "UNSPECIFIED",
      city: input.city ?? null,
      addressLine: input.addressLine ?? null,
      birthday: input.birthday ?? null,
      notes: input.notes ?? null,
      searchText: customerSearchText({
        fullName,
        phone,
        code: existing.code,
        email: input.email,
        city: input.city,
      }),
    },
  });

  // Order titles carry the customer name for search, so a rename has to
  // propagate or the customer becomes unfindable through their orders.
  if (customer.fullName !== fullName) {
    await refreshOrderSearchText(tenant.businessId, customerId);
  }

  await audit(tenant, {
    action: "customer.updated",
    entityType: "customer",
    entityId: customer.id,
    summary: `Updated ${fullName}'s details.`,
  });

  return customer;
}

export async function refreshOrderSearchText(
  businessId: string,
  customerId: string,
) {
  const orders = await prisma.order.findMany({
    where: { businessId, customerId },
    select: {
      id: true,
      code: true,
      title: true,
      fabric: true,
      description: true,
      customer: { select: { fullName: true } },
    },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id, businessId },
      data: {
        searchText: [
          `#${order.code}`,
          order.code,
          order.title,
          order.customer.fullName,
          order.fabric,
          order.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      },
    });
  }
}

export async function setCustomerTags(
  tenant: Pick<TenantContext, "businessId">,
  customerId: string,
  labels: string[],
) {
  await prisma.customerTag.deleteMany({
    where: { businessId: tenant.businessId, customerId },
  });

  if (labels.length > 0) {
    await prisma.customerTag.createMany({
      data: labels.map((label) => ({
        businessId: tenant.businessId,
        customerId,
        label,
      })),
    });
  }
}

/** Replaces the whole preference set for one kind, e.g. all FABRIC choices. */
export async function setStylePreferences(
  tenant: Pick<TenantContext, "businessId">,
  customerId: string,
  kind: "STYLE" | "COLOR" | "FABRIC",
  values: string[],
) {
  await prisma.stylePreference.deleteMany({
    where: { businessId: tenant.businessId, customerId, kind },
  });

  if (values.length > 0) {
    await prisma.stylePreference.createMany({
      data: values.map((value) => ({
        businessId: tenant.businessId,
        customerId,
        kind,
        value,
      })),
    });
  }
}
