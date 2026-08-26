"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  ImagePlus,
  Link2,
  Palette,
  Trash2,
  Upload,
} from "lucide-react";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/dialog";
import { STYLE_CATEGORIES, STYLE_CATEGORY_META, labelFor } from "@/lib/domain";
import { formatShortDate } from "@/lib/dates";
import { addStyleItemAction, deleteStyleItemAction } from "@/server/photo-actions";

export type StyleItem = {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  storageKey: string | null;
  externalUrl: string | null;
  createdAt: Date;
  customer: { id: string; fullName: string } | null;
};

export function AddStyleButton({
  customers,
  defaultCategory,
}: {
  customers: { id: string; fullName: string }[];
  defaultCategory?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <ImagePlus />
        Add a style
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add to your style library"
        description="Your own catalogue of cuts you can make, to show customers instead of describing."
        size="lg"
      >
        <ActionForm action={addStyleItemAction} className="space-y-5">
          <Field
            label="What is it called?"
            htmlFor="style-title"
            required
            error={<FieldError name="title" />}
          >
            <Input
              id="style-title"
              name="title"
              required
              placeholder="High-neck Kente gown with cape sleeves"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="style-category" required>
              <Select
                id="style-category"
                name="category"
                defaultValue={defaultCategory ?? "DRESSES"}
              >
                {STYLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {labelFor(STYLE_CATEGORY_META, category)}
                  </option>
                ))}
              </Select>
            </Field>

            {customers.length > 0 ? (
              <Field
                label="Made for"
                htmlFor="style-customer"
                hint="Optional."
                error={<FieldError name="customerId" />}
              >
                <Select id="style-customer" name="customerId" defaultValue="">
                  <option value="">Nobody in particular</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>

          <Field
            label="Picture"
            hint="A photo of the piece, or of the reference you work from."
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface-muted/40 px-4 py-3.5 transition-colors hover:border-ink-300">
              <Upload className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
              <span className="min-w-0 flex-1 text-[0.8125rem] text-muted-foreground">
                {preview ? "Change picture" : "Choose a picture"}
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>

            {preview ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Selected style"
                  className="max-h-56 w-full object-cover"
                />
              </div>
            ) : null}
          </Field>

          <Field
            label="Or a link"
            htmlFor="style-url"
            hint="Instagram, Pinterest, anywhere you found it."
            error={<FieldError name="externalUrl" />}
          >
            <Input
              id="style-url"
              name="externalUrl"
              inputMode="url"
              placeholder="https://instagram.com/p/…"
            />
          </Field>

          <Field label="Notes" htmlFor="style-notes" error={<FieldError name="notes" />}>
            <Textarea
              id="style-notes"
              name="notes"
              rows={2}
              placeholder="Needs 6 yards. Lining required. Two fittings."
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" pendingLabel="Saving…">
              Add to library
            </SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}

export function StyleGrid({
  items,
  canEdit,
}: {
  items: StyleItem[];
  canEdit: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="group overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-md"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
            {item.storageKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${item.storageKey}`}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-2 text-subtle-foreground">
                <Palette className="size-6" aria-hidden />
                <span className="text-[0.6875rem]">No picture</span>
              </span>
            )}

            <span className="absolute top-2.5 left-2.5">
              <Badge size="sm" tone="neutral">
                {labelFor(STYLE_CATEGORY_META, item.category)}
              </Badge>
            </span>
          </div>

          <div className="p-3.5">
            <p className="truncate text-[0.8125rem] font-medium text-foreground">
              {item.title}
            </p>
            <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
              {item.customer ? item.customer.fullName : formatShortDate(item.createdAt)}
            </p>

            {item.notes ? (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {item.notes}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-1">
              {item.externalUrl ? (
                <Button asChild variant="ghost" size="xs">
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Link2 />
                    Source
                  </a>
                </Button>
              ) : null}

              {item.customer ? (
                <Button asChild variant="ghost" size="xs">
                  <Link href={`/app/customers/${item.customer.id}`}>
                    <ExternalLink />
                    Customer
                  </Link>
                </Button>
              ) : null}

              {canEdit ? (
                <form
                  action={deleteStyleItemAction}
                  className="ml-auto"
                  onSubmit={(event) => {
                    if (!window.confirm(`Remove "${item.title}" from your library?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="itemId" value={item.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="xs"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 />
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
