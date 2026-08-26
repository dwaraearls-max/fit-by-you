"use client";

import * as React from "react";
import { CalendarPlus } from "lucide-react";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/dialog";
import { APPOINTMENT_TYPES, APPOINTMENT_TYPE_META, labelFor } from "@/lib/domain";
import { toDateTimeInputValue } from "@/lib/dates";
import { createAppointmentAction } from "@/server/calendar-actions";

export function AddAppointmentButton({
  customers,
  defaultDay,
}: {
  customers: { id: string; fullName: string }[];
  /** `yyyy-MM-dd` of the day the tailor has selected, if any. */
  defaultDay?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  const defaultValue = defaultDay
    ? `${defaultDay}T10:00`
    : toDateTimeInputValue(new Date());

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus />
        Add to calendar
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add to your calendar"
        description="Consultations, collections, anything you need to remember."
      >
        <ActionForm action={createAppointmentAction} className="space-y-5">
          <Field
            label="What is it?"
            htmlFor="appointment-title"
            required
            error={<FieldError name="title" />}
          >
            <Input
              id="appointment-title"
              name="title"
              required
              placeholder="Consultation — wedding party of six"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kind" htmlFor="appointment-type">
              <Select
                id="appointment-type"
                name="type"
                defaultValue="CONSULTATION"
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {labelFor(APPOINTMENT_TYPE_META, type)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="How long"
              htmlFor="appointment-duration"
              hint="In minutes."
            >
              <Input
                id="appointment-duration"
                name="durationMinutes"
                type="number"
                min={5}
                step={5}
                defaultValue={30}
                className="tabular"
              />
            </Field>
          </div>

          <Field
            label="When"
            htmlFor="appointment-when"
            required
            error={<FieldError name="scheduledFor" />}
          >
            <Input
              id="appointment-when"
              name="scheduledFor"
              type="datetime-local"
              required
              defaultValue={defaultValue}
            />
          </Field>

          {customers.length > 0 ? (
            <Field
              label="Who with"
              htmlFor="appointment-customer"
              hint="Optional."
              error={<FieldError name="customerId" />}
            >
              <Select id="appointment-customer" name="customerId" defaultValue="">
                <option value="">Nobody in particular</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field
            label="Notes"
            htmlFor="appointment-notes"
            error={<FieldError name="notes" />}
          >
            <Textarea
              id="appointment-notes"
              name="notes"
              rows={2}
              placeholder="Bringing her mother and two bridesmaids."
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" pendingLabel="Saving…">
              Add to calendar
            </SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
