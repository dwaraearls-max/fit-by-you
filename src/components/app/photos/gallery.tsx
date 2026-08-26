"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PHOTO_CATEGORY_META, labelFor } from "@/lib/domain";
import { formatShortDate } from "@/lib/dates";
import { deletePhotoAction, setCustomerPhotoAction } from "@/server/photo-actions";

export type GalleryPhoto = {
  id: string;
  storageKey: string;
  category: string;
  caption: string | null;
  createdAt: Date;
  fileName: string;
  order: { id: string; title: string } | null;
};

/**
 * The gallery and its lightbox.
 *
 * Photos are the one place in the product where the content should be bigger
 * than the interface, so the grid is edge-to-edge and the viewer is full-bleed
 * with the controls kept out of the way until wanted.
 */
export function PhotoGallery({
  photos,
  canDelete,
  canSetProfile,
}: {
  photos: GalleryPhoto[];
  canDelete: boolean;
  canSetProfile: boolean;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const open = openIndex !== null ? photos[openIndex] : null;

  const move = React.useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        const next = current + delta;
        if (next < 0 || next >= photos.length) return current;
        return next;
      });
    },
    [photos.length],
  );

  React.useEffect(() => {
    if (openIndex === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, move]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group block w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-surface text-left shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="aspect-square overflow-hidden bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${photo.storageKey}`}
                  alt={photo.caption ?? photo.fileName}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-xs font-medium text-foreground">
                  {photo.caption ?? labelFor(PHOTO_CATEGORY_META, photo.category)}
                </p>
                <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                  {formatShortDate(photo.createdAt)}
                  {photo.order ? ` · ${photo.order.title}` : ""}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink-950/92 backdrop-blur-sm"
          style={{ animation: "fade-in 0.15s ease-out" }}
          role="dialog"
          aria-modal="true"
          aria-label={open.caption ?? "Photo"}
        >
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0 text-ivory-100">
              <p className="truncate text-sm font-medium">
                {open.caption ?? labelFor(PHOTO_CATEGORY_META, open.category)}
              </p>
              <p className="mt-0.5 text-xs text-ivory-100/60">
                {labelFor(PHOTO_CATEGORY_META, open.category)} ·{" "}
                {formatShortDate(open.createdAt)}
                {openIndex !== null
                  ? ` · ${openIndex + 1} of ${photos.length}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label="Close"
              className="shrink-0 cursor-pointer rounded-lg p-2 text-ivory-100/70 transition-colors hover:bg-ivory-100/10 hover:text-ivory-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
            {openIndex !== null && openIndex > 0 ? (
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous photo"
                className="absolute left-2 z-10 cursor-pointer rounded-full bg-ink-950/60 p-2.5 text-ivory-100 transition-colors hover:bg-ink-950/90 sm:left-6"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${open.storageKey}`}
              alt={open.caption ?? open.fileName}
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            />

            {openIndex !== null && openIndex < photos.length - 1 ? (
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next photo"
                className="absolute right-2 z-10 cursor-pointer rounded-full bg-ink-950/60 p-2.5 text-ivory-100 transition-colors hover:bg-ink-950/90 sm:right-6"
              >
                <ChevronRight className="size-5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-ivory-100/10 px-4 py-3.5">
            {open.order ? (
              <Button asChild variant="ghost" size="sm" className="text-ivory-100">
                <Link href={`/app/orders/${open.order.id}`}>
                  {open.order.title}
                </Link>
              </Button>
            ) : null}

            {canSetProfile ? (
              <form action={setCustomerPhotoAction}>
                <input type="hidden" name="photoId" value={open.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-ivory-100"
                >
                  <UserRound />
                  Use as profile photo
                </Button>
              </form>
            ) : null}

            {canDelete ? (
              <form
                action={deletePhotoAction}
                onSubmit={(event) => {
                  if (!window.confirm("Delete this photo? It cannot be undone.")) {
                    event.preventDefault();
                    return;
                  }
                  setOpenIndex(null);
                }}
              >
                <input type="hidden" name="photoId" value={open.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-critical"
                >
                  <Trash2 />
                  Delete
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** A compact strip used on the profile Overview, linking through to the gallery. */
export function PhotoStrip({
  photos,
  href,
}: {
  photos: { id: string; storageKey: string; caption: string | null }[];
  href: string;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={href}
          className="shrink-0 overflow-hidden rounded-lg border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${photo.storageKey}`}
            alt={photo.caption ?? "Customer photo"}
            loading="lazy"
            className="size-20 object-cover"
          />
        </Link>
      ))}
    </div>
  );
}
