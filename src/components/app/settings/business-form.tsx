"use client";

import { updateBusinessAction } from "@/server/settings-actions";
import { BUSINESS_TYPES, BUSINESS_TYPE_META } from "@/lib/domain";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export type BusinessValues = {
  name: string;
  type: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  city: string | null;
  country: string;
  currency: string;
};

const COUNTRIES = [
  { code: "GH", label: "Ghana", currency: "GHS" },
  { code: "NG", label: "Nigeria", currency: "NGN" },
  { code: "KE", label: "Kenya", currency: "KES" },
  { code: "ZA", label: "South Africa", currency: "ZAR" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
  { code: "US", label: "United States", currency: "USD" },
];

export function BusinessForm({
  values,
  readOnly,
}: {
  values: BusinessValues;
  readOnly: boolean;
}) {
  return (
    <ActionForm action={updateBusinessAction} bannerPosition="bottom">
      <fieldset disabled={readOnly} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name" htmlFor="name" required>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              autoComplete="organization"
            />
            <FieldError name="name" />
          </Field>

          <Field label="What you do" htmlFor="type">
            <Select id="type" name="type" defaultValue={values.type}>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_META[type].label}
                </option>
              ))}
            </Select>
            <FieldError name="type" />
          </Field>
        </div>

        <Field
          label="Tagline"
          htmlFor="tagline"
          hint="Appears on receipts. Something like “Bespoke tailoring since 2014”."
        >
          <Input
            id="tagline"
            name="tagline"
            defaultValue={values.tagline ?? ""}
            maxLength={160}
          />
          <FieldError name="tagline" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={values.phone ?? ""}
            />
            <FieldError name="phone" />
          </Field>

          <Field label="WhatsApp" htmlFor="whatsapp" hint="Used for deep links.">
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={values.whatsapp ?? ""}
            />
            <FieldError name="whatsapp" />
          </Field>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={values.email ?? ""}
            />
            <FieldError name="email" />
          </Field>
        </div>

        <Field label="Workshop address" htmlFor="addressLine">
          <Textarea
            id="addressLine"
            name="addressLine"
            rows={2}
            defaultValue={values.addressLine ?? ""}
          />
          <FieldError name="addressLine" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={values.city ?? ""} />
            <FieldError name="city" />
          </Field>

          <Field label="Country" htmlFor="country">
            <Select id="country" name="country" defaultValue={values.country}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </Select>
            <FieldError name="country" />
          </Field>

          <Field
            label="Currency"
            htmlFor="currency"
            hint="Existing amounts are not converted."
          >
            <Select id="currency" name="currency" defaultValue={values.currency}>
              {[...new Set(COUNTRIES.map((country) => country.currency))].map(
                (code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ),
              )}
            </Select>
            <FieldError name="currency" />
          </Field>
        </div>

        {readOnly ? null : (
          <div className="flex justify-end">
            <SubmitButton>Save changes</SubmitButton>
          </div>
        )}
      </fieldset>
    </ActionForm>
  );
}
