import type { Metadata } from "next";
import { Images, SearchX } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { STYLE_CATEGORIES, STYLE_CATEGORY_META, labelFor } from "@/lib/domain";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { FilterChips, SearchField } from "@/components/app/list-controls";
import {
  AddStyleButton,
  StyleGrid,
} from "@/components/app/styles/style-library";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Style Library" };

export default async function StylesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q.trim() : "";
  const filterParam = typeof params.filter === "string" ? params.filter : "ALL";
  const category = (STYLE_CATEGORIES as readonly string[]).includes(filterParam)
    ? filterParam
    : undefined;

  const canEdit = tenant.can("style:write");

  const [items, counts, customers] = await Promise.all([
    prisma.styleLibraryItem.findMany({
      where: {
        businessId: tenant.businessId,
        ...(category ? { category } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { notes: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        notes: true,
        storageKey: true,
        externalUrl: true,
        createdAt: true,
        customer: { select: { id: true, fullName: true } },
      },
      take: 200,
    }),
    prisma.styleLibraryItem.groupBy({
      by: ["category"],
      where: { businessId: tenant.businessId },
      _count: { _all: true },
    }),
    canEdit
      ? prisma.customer.findMany({
          where: { businessId: tenant.businessId, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
          take: 300,
        })
      : Promise.resolve([]),
  ]);

  const total = counts.reduce((sum, row) => sum + row._count._all, 0);
  const countFor = (value: string) =>
    counts.find((row) => row.category === value)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-[84rem]">
      <PageHeader
        title="Style Library"
        description="Your own catalogue of what you can make — to show, rather than describe."
        actions={
          canEdit ? (
            <AddStyleButton customers={customers} defaultCategory={category} />
          ) : null
        }
      />

      {total === 0 ? (
        <div className="rounded-xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={Images}
            title="Your library is empty."
            message="Photograph the pieces you are proud of as you finish them. In a few months you will have a catalogue that sells the next order for you."
            action={
              canEdit ? (
                <AddStyleButton customers={customers} />
              ) : null
            }
          />
        </div>
      ) : (
        <>
          <SearchField
            placeholder="Search your styles…"
            className="sm:max-w-md"
          />

          <FilterChips
            className="mt-4"
            options={[
              { value: "ALL", label: "Everything", count: total },
              ...STYLE_CATEGORIES.filter((value) => countFor(value) > 0).map(
                (value) => ({
                  value,
                  label: labelFor(STYLE_CATEGORY_META, value),
                  count: countFor(value),
                }),
              ),
            ]}
          />

          <p className="mt-5 mb-4 text-xs text-muted-foreground">
            {pluralise(items.length, "style")}
            {category
              ? ` in ${labelFor(STYLE_CATEGORY_META, category)}`
              : " in your library"}
            {query ? ` matching “${query}”` : ""}.
          </p>

          {items.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface shadow-xs">
              <EmptyState
                icon={SearchX}
                title="Nothing here."
                message="Try another category, or a different word from the title."
              />
            </div>
          ) : (
            <StyleGrid items={items} canEdit={canEdit} />
          )}
        </>
      )}
    </div>
  );
}
