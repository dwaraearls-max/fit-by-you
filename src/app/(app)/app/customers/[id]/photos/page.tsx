import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Images } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_META, labelFor } from "@/lib/domain";
import { pluralise } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { PhotoUploader } from "@/components/app/photos/photo-uploader";
import { PhotoGallery } from "@/components/app/photos/gallery";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Photos" };

export default async function CustomerPhotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  const { id } = await params;
  const search = await searchParams;

  const [customer, photos, orders] = await Promise.all([
    prisma.customer.findFirst({
      where: { id, businessId: tenant.businessId },
      select: { id: true, fullName: true, firstName: true },
    }),
    prisma.customerPhoto.findMany({
      where: { businessId: tenant.businessId, customerId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        storageKey: true,
        category: true,
        caption: true,
        createdAt: true,
        fileName: true,
        order: { select: { id: true, title: true } },
      },
    }),
    prisma.order.findMany({
      where: { businessId: tenant.businessId, customerId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, code: true },
      take: 40,
    }),
  ]);

  if (!customer) notFound();

  const canUpload = tenant.can("photo:write");
  const groups = PHOTO_CATEGORIES.map((category) => ({
    category,
    photos: photos.filter((photo) => photo.category === category),
  })).filter((group) => group.photos.length > 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        back={{ href: `/app/customers/${customer.id}`, label: customer.fullName }}
        title="Photos"
        description={
          photos.length === 0
            ? `Nothing on file for ${customer.firstName} yet.`
            : `${pluralise(photos.length, "photo")} across ${pluralise(
                groups.length,
                "gallery",
                "galleries",
              )}.`
        }
      />

      <div className="space-y-6">
        {canUpload ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Add photos</CardTitle>
                <CardDescription>
                  Straight from the camera, or from your gallery.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <PhotoUploader
                customerId={customer.id}
                orders={orders}
                defaultOrderId={
                  typeof search.order === "string" ? search.order : undefined
                }
                defaultCategory={
                  typeof search.category === "string" ? search.category : undefined
                }
              />
            </CardContent>
          </Card>
        ) : null}

        {photos.length === 0 ? (
          <Card>
            <EmptyState
              icon={Images}
              title="No photos yet."
              message={`A photo of the style ${customer.firstName} wants, the fabric she brought, and the finished outfit is the fastest way to remember a job months later.`}
            />
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.category}>
              <CardHeader>
                <div>
                  <CardTitle>
                    {labelFor(PHOTO_CATEGORY_META, group.category)}
                  </CardTitle>
                  <CardDescription>
                    {pluralise(group.photos.length, "photo")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <PhotoGallery
                  photos={group.photos}
                  canDelete={tenant.can("photo:delete")}
                  canSetProfile={tenant.can("customer:write")}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
