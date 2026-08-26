"use client";

import * as React from "react";
import { Camera, ImagePlus, Upload, X } from "lucide-react";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_META, labelFor } from "@/lib/domain";
import { uploadPhotosAction } from "@/server/photo-actions";

type Chosen = { name: string; url: string; size: number };

/**
 * Photo capture.
 *
 * On a phone the primary action is the camera, because the tailor is standing
 * next to the customer holding the fabric. On a desktop the same control is a
 * file picker. Both feed one form, and previews are generated locally so the
 * upload is never a leap of faith.
 */
export function PhotoUploader({
  customerId,
  orders,
  defaultOrderId,
  defaultCategory = "REFERENCE",
}: {
  customerId: string;
  orders: { id: string; title: string; code: string }[];
  defaultOrderId?: string;
  defaultCategory?: string;
}) {
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const pickerRef = React.useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = React.useState<Chosen[]>([]);

  // Object URLs are revoked when the selection changes so previews do not leak.
  React.useEffect(() => {
    return () => chosen.forEach((item) => URL.revokeObjectURL(item.url));
  }, [chosen]);

  function describe(files: FileList | null) {
    if (!files) return;
    setChosen(
      Array.from(files).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      })),
    );
  }

  function clear() {
    setChosen([]);
    if (cameraRef.current) cameraRef.current.value = "";
    if (pickerRef.current) pickerRef.current.value = "";
  }

  return (
    <ActionForm action={uploadPhotosAction} className="space-y-5">
      <input type="hidden" name="customerId" value={customerId} />

      {/* Two inputs, one field name: whichever the tailor used carries the files. */}
      <input
        ref={cameraRef}
        type="file"
        name="photos"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => describe(event.target.files)}
      />
      <input
        ref={pickerRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => describe(event.target.files)}
      />

      {chosen.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/40 px-5 py-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-accent-border bg-accent-soft">
            <ImagePlus
              className="size-5 text-champagne-700 dark:text-champagne-300"
              aria-hidden
            />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Add photos to this record
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            The style she brought in, the fabric, the finished outfit. Anything
            you would otherwise keep in your phone gallery.
          </p>
          <div className="mt-5 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera />
              Take a photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => pickerRef.current?.click()}
            >
              <Upload />
              Choose from device
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.8125rem] font-medium text-foreground">
              {chosen.length === 1 ? "1 photo ready" : `${chosen.length} photos ready`}
            </p>
            <Button type="button" variant="ghost" size="xs" onClick={clear}>
              <X />
              Clear
            </Button>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {chosen.map((item) => (
              <figure
                key={item.url}
                className="overflow-hidden rounded-lg border border-border"
              >
                <div className="aspect-square bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                </div>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="What kind of photo?" htmlFor="category">
          <Select id="category" name="category" defaultValue={defaultCategory}>
            {PHOTO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {labelFor(PHOTO_CATEGORY_META, category)}
              </option>
            ))}
          </Select>
        </Field>

        {orders.length > 0 ? (
          <Field
            label="Attach to an outfit"
            htmlFor="orderId"
            hint="Optional. It will show on the order too."
            error={<FieldError name="orderId" />}
          >
            <Select
              id="orderId"
              name="orderId"
              defaultValue={defaultOrderId ?? ""}
            >
              <option value="">Not attached</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.title} · #{order.code}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field
          label="Caption"
          htmlFor="caption"
          className="sm:col-span-2"
          error={<FieldError name="caption" />}
        >
          <Input
            id="caption"
            name="caption"
            placeholder="Neckline she liked from the magazine"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <SubmitButton
          variant="primary"
          disabled={chosen.length === 0}
          pendingLabel="Uploading…"
        >
          Save {chosen.length > 1 ? `${chosen.length} photos` : "photo"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
