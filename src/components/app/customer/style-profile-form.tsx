"use client";

import Link from "next/link";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChoiceCard, Field, PillToggle, Textarea } from "@/components/ui/field";
import {
  COLOR_PREFERENCES,
  FABRIC_PREFERENCES,
  FABRIC_PREFERENCE_META,
  PREFERRED_FITS,
  PREFERRED_FIT_META,
  STYLE_PREFERENCES,
  STYLE_PREFERENCE_META,
  labelFor,
} from "@/lib/domain";
import { saveStyleProfileAction } from "@/server/customer-actions";

const FIT_HINTS: Record<string, string> = {
  SLIM: "Close to the body, minimal ease.",
  REGULAR: "Standard ease, the usual choice.",
  RELAXED: "Extra room through the body.",
  OVERSIZED: "Deliberately loose and draped.",
};

export function StyleProfileForm({
  customerId,
  values,
}: {
  customerId: string;
  values: {
    preferredFit: string;
    styleNotes: string;
    avoidNotes: string;
    occasionNotes: string;
    styles: string[];
    colors: string[];
    fabrics: string[];
  };
}) {
  return (
    <ActionForm action={saveStyleProfileAction} className="space-y-6">
      <input type="hidden" name="customerId" value={customerId} />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Preferred fit</CardTitle>
            <CardDescription>How they like a garment to sit.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PREFERRED_FITS.map((fit) => (
            <ChoiceCard
              key={fit}
              name="preferredFit"
              value={fit}
              label={labelFor(PREFERRED_FIT_META, fit)}
              description={FIT_HINTS[fit]}
              defaultChecked={values.preferredFit === fit}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Styles</CardTitle>
            <CardDescription>Pick every one that applies.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STYLE_PREFERENCES.map((style) => (
              <PillToggle
                key={style}
                name="style"
                value={style}
                label={labelFor(STYLE_PREFERENCE_META, style)}
                defaultChecked={values.styles.includes(style)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Colours</CardTitle>
            <CardDescription>
              The shades that suit them, so you can suggest with confidence.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COLOR_PREFERENCES.map((colour) => (
              <PillToggle
                key={colour.value}
                name="color"
                value={colour.value}
                label={colour.label}
                swatch={colour.hex}
                defaultChecked={values.colors.includes(colour.value)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fabrics</CardTitle>
            <CardDescription>What they keep coming back to.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FABRIC_PREFERENCES.map((fabric) => (
              <PillToggle
                key={fabric}
                name="fabric"
                value={fabric}
                label={labelFor(FABRIC_PREFERENCE_META, fabric)}
                defaultChecked={values.fabrics.includes(fabric)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>In their own words</CardTitle>
            <CardDescription>
              The details that never fit into a checkbox.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            label="What works"
            htmlFor="styleNotes"
            error={<FieldError name="styleNotes" />}
          >
            <Textarea
              id="styleNotes"
              name="styleNotes"
              rows={3}
              defaultValue={values.styleNotes}
              placeholder="Loves a defined waist. Prefers sleeves that cover the elbow."
            />
          </Field>

          <Field
            label="Avoid"
            htmlFor="avoidNotes"
            error={<FieldError name="avoidNotes" />}
          >
            <Textarea
              id="avoidNotes"
              name="avoidNotes"
              rows={3}
              defaultValue={values.avoidNotes}
              placeholder="No halter necks. Does not wear yellow."
            />
          </Field>

          <Field
            label="Usually dressing for"
            htmlFor="occasionNotes"
            error={<FieldError name="occasionNotes" />}
          >
            <Textarea
              id="occasionNotes"
              name="occasionNotes"
              rows={3}
              defaultValue={values.occasionNotes}
              placeholder="Church on Sundays, weddings through the dry season, occasional corporate events."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="ghost">
          <Link href={`/app/customers/${customerId}?tab=styles`}>Cancel</Link>
        </Button>
        <SubmitButton variant="primary" pendingLabel="Saving…">
          Save style profile
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
