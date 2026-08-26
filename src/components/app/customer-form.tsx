"use client";

import Link from "next/link";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Field, Input, PillToggle, Select, Textarea } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CUSTOMER_TAGS, CUSTOMER_TAG_META, GENDERS, GENDER_META, labelFor } from "@/lib/domain";
import { toDateInputValue } from "@/lib/dates";
import type { FormState } from "@/server/form";

export type CustomerFormValues = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  gender: string;
  city: string | null;
  addressLine: string | null;
  birthday: Date | null;
  notes: string | null;
  tags: string[];
};

/**
 * One form for both creating and editing. Only name and phone are required —
 * the brief is explicit that adding a customer must take seconds, and every
 * other detail can be filled in later from the profile.
 */
export function CustomerForm({
  action,
  values,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  values?: Partial<CustomerFormValues>;
  submitLabel: string;
  cancelHref: string;
}) {
  const tags = values?.tags ?? ["NEW"];

  return (
    <ActionForm action={action} className="space-y-6">
      {values?.id ? <input type="hidden" name="customerId" value={values.id} /> : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Who are they?</CardTitle>
            <CardDescription>
              A name and a phone number is enough to get started.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required error={<FieldError name="firstName" />}>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              required
              defaultValue={values?.firstName ?? ""}
              placeholder="Amanda"
            />
          </Field>

          <Field label="Last name" htmlFor="lastName" required error={<FieldError name="lastName" />}>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              defaultValue={values?.lastName ?? ""}
              placeholder="Mensah"
            />
          </Field>

          <Field
            label="Phone number"
            htmlFor="phone"
            required
            hint="Used for WhatsApp updates and reminders."
            error={<FieldError name="phone" />}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              defaultValue={values?.phone ?? ""}
              placeholder="024 123 4567"
            />
          </Field>

          <Field
            label="Second phone"
            htmlFor="altPhone"
            hint="Optional."
            error={<FieldError name="altPhone" />}
          >
            <Input
              id="altPhone"
              name="altPhone"
              type="tel"
              inputMode="tel"
              defaultValue={values?.altPhone ?? ""}
              placeholder="055 987 6543"
            />
          </Field>

          <Field label="Email" htmlFor="email" error={<FieldError name="email" />}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={values?.email ?? ""}
              placeholder="amanda@example.com"
            />
          </Field>

          <Field label="Gender" htmlFor="gender">
            <Select id="gender" name="gender" defaultValue={values?.gender ?? "UNSPECIFIED"}>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {labelFor(GENDER_META, gender)}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Where and when</CardTitle>
            <CardDescription>
              Helpful for deliveries and for remembering birthdays.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="City or town" htmlFor="city" error={<FieldError name="city" />}>
            <Input
              id="city"
              name="city"
              defaultValue={values?.city ?? ""}
              placeholder="Accra"
            />
          </Field>

          <Field label="Birthday" htmlFor="birthday" error={<FieldError name="birthday" />}>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={toDateInputValue(values?.birthday ?? null)}
            />
          </Field>

          <Field
            label="Address"
            htmlFor="addressLine"
            className="sm:col-span-2"
            error={<FieldError name="addressLine" />}
          >
            <Input
              id="addressLine"
              name="addressLine"
              defaultValue={values?.addressLine ?? ""}
              placeholder="House number, street, area"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tags and notes</CardTitle>
            <CardDescription>
              Tags make the customer list easy to filter later.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_TAGS.map((tag) => (
                <PillToggle
                  key={tag}
                  name="tags"
                  value={tag}
                  label={labelFor(CUSTOMER_TAG_META, tag)}
                  defaultChecked={tags.includes(tag)}
                />
              ))}
            </div>
          </Field>

          <Field
            label="Notes"
            htmlFor="notes"
            hint="Anything worth remembering — how they like to be contacted, who referred them, what they are hard to please about."
            error={<FieldError name="notes" />}
          >
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={values?.notes ?? ""}
              placeholder="Prefers WhatsApp voice notes. Always wants a slightly longer sleeve."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton variant="primary">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
