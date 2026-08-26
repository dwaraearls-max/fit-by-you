"use client";

import { updatePreferencesAction } from "@/server/settings-actions";
import { MEASUREMENT_UNITS } from "@/lib/domain";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Field, Select, Switch, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export type PreferenceValues = {
  defaultUnit: string;
  timezone: string;
  weekStartsOn: number;
  receiptFooter: string | null;
  whatsappOrderTemplate: string;
  whatsappPaymentTemplate: string;
  whatsappFittingTemplate: string;
  notifyNewOrder: boolean;
  notifyPaymentReceived: boolean;
  notifyPaymentOverdue: boolean;
  notifyFittingTomorrow: boolean;
  notifyDeliveryDue: boolean;
  notifyNewCustomer: boolean;
  notifyMeasurementUpdated: boolean;
  notifySubscription: boolean;
};

const TIMEZONES = [
  "Africa/Accra",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
];

const NOTIFICATIONS: {
  key: keyof PreferenceValues;
  label: string;
  hint: string;
}[] = [
  {
    key: "notifyNewOrder",
    label: "A new order is taken",
    hint: "Useful when more than one person writes orders up.",
  },
  {
    key: "notifyPaymentReceived",
    label: "A payment comes in",
    hint: "Including deposits recorded by your team.",
  },
  {
    key: "notifyPaymentOverdue",
    label: "A balance goes unpaid",
    hint: "So chasing money never depends on remembering.",
  },
  {
    key: "notifyFittingTomorrow",
    label: "A fitting is tomorrow",
    hint: "The evening before, so you can prepare the piece.",
  },
  {
    key: "notifyDeliveryDue",
    label: "A delivery is due",
    hint: "On the morning of the promised day.",
  },
  { key: "notifyNewCustomer", label: "A new customer is added", hint: "" },
  {
    key: "notifyMeasurementUpdated",
    label: "Someone's measurements change",
    hint: "Off by default — measurements change often and that is normal.",
  },
  { key: "notifySubscription", label: "Your subscription renews", hint: "" },
];

const TEMPLATES: {
  name: keyof PreferenceValues;
  label: string;
  hint: string;
}[] = [
  {
    name: "whatsappOrderTemplate",
    label: "Order update",
    hint: "Sent from an order when you move it along.",
  },
  {
    name: "whatsappPaymentTemplate",
    label: "Payment reminder",
    hint: "Sent when a balance is outstanding.",
  },
  {
    name: "whatsappFittingTemplate",
    label: "Fitting invitation",
    hint: "Sent when you book someone in for a fitting.",
  },
];

export function PreferencesForm({
  values,
  readOnly,
}: {
  values: PreferenceValues;
  readOnly: boolean;
}) {
  return (
    <ActionForm action={updatePreferencesAction} bannerPosition="bottom">
      <fieldset disabled={readOnly} className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Measure in"
            htmlFor="defaultUnit"
            hint="What new measurement forms start in."
          >
            <Select
              id="defaultUnit"
              name="defaultUnit"
              defaultValue={values.defaultUnit}
            >
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === "in" ? "Inches" : "Centimetres"}
                </option>
              ))}
            </Select>
            <FieldError name="defaultUnit" />
          </Field>

          <Field label="Time zone" htmlFor="timezone">
            <Select id="timezone" name="timezone" defaultValue={values.timezone}>
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace("_", " ")}
                </option>
              ))}
            </Select>
            <FieldError name="timezone" />
          </Field>

          <Field label="Weeks start on" htmlFor="weekStartsOn">
            <Select
              id="weekStartsOn"
              name="weekStartsOn"
              defaultValue={String(values.weekStartsOn)}
            >
              <option value="1">Monday</option>
              <option value="0">Sunday</option>
            </Select>
            <FieldError name="weekStartsOn" />
          </Field>
        </div>

        <Field
          label="Receipt footer"
          htmlFor="receiptFooter"
          hint="Printed at the bottom of every receipt. Deposits, alteration policy, thanks."
        >
          <Textarea
            id="receiptFooter"
            name="receiptFooter"
            rows={2}
            defaultValue={values.receiptFooter ?? ""}
            maxLength={240}
          />
          <FieldError name="receiptFooter" />
        </Field>

        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            WhatsApp messages
          </h3>
          <p className="mt-1 mb-4 text-xs leading-relaxed text-muted-foreground">
            These are filled in and opened in WhatsApp for you — nothing is sent
            without you pressing send. Use{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{customer}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{business}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{outfit}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{status}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{amount}"}
            </code>
            ,{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{date}"}
            </code>{" "}
            and{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-[0.6875rem]">
              {"{time}"}
            </code>
            .
          </p>

          <div className="space-y-5">
            {TEMPLATES.map((template) => (
              <Field
                key={template.name}
                label={template.label}
                htmlFor={template.name}
                hint={template.hint}
              >
                <Textarea
                  id={template.name}
                  name={template.name}
                  rows={2}
                  defaultValue={String(values[template.name] ?? "")}
                />
                <FieldError name={template.name} />
              </Field>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-tight">Tell me when</h3>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            These appear in the bell at the top of the app.
          </p>

          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {NOTIFICATIONS.map((notification) => (
              <li
                key={notification.key}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <label
                  htmlFor={notification.key}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <span className="block text-[0.8125rem] font-medium text-foreground">
                    {notification.label}
                  </span>
                  {notification.hint ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {notification.hint}
                    </span>
                  ) : null}
                </label>
                <Switch
                  id={notification.key}
                  name={notification.key}
                  defaultChecked={Boolean(values[notification.key])}
                />
              </li>
            ))}
          </ul>
        </div>

        {readOnly ? null : (
          <div className="flex justify-end">
            <SubmitButton>Save preferences</SubmitButton>
          </div>
        )}
      </fieldset>
    </ActionForm>
  );
}
