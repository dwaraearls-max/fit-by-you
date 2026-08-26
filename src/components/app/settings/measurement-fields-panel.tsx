"use client";

import * as React from "react";
import { Eye, EyeOff, Plus } from "lucide-react";

import {
  addMeasurementFieldAction,
  toggleMeasurementFieldAction,
} from "@/server/settings-actions";
import {
  MEASUREMENT_GROUPS,
  MEASUREMENT_GROUP_META,
  MEASUREMENT_UNITS,
  type MeasurementGroup,
} from "@/lib/domain";
import { pluralise } from "@/lib/utils";
import { ActionForm, FieldError } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export type FieldRow = {
  id: string;
  key: string;
  label: string;
  group: MeasurementGroup;
  unit: string;
  isCustom: boolean;
  isActive: boolean;
  usageCount: number;
};

export function MeasurementFieldsPanel({
  fields,
  canWrite,
}: {
  fields: FieldRow[];
  canWrite: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          These are the measurements your form asks for. Hide the ones you never
          take, and add the ones you do. Nothing already recorded is ever
          changed or lost.
        </p>
        {canWrite ? (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Plus />
            Add a measurement
          </Button>
        ) : null}
      </div>

      <div className="space-y-6">
        {MEASUREMENT_GROUPS.map((group) => {
          const rows = fields.filter((field) => field.group === group);
          if (rows.length === 0) return null;

          return (
            <section key={group}>
              <h3 className="text-[0.8125rem] font-semibold tracking-tight">
                {MEASUREMENT_GROUP_META[group].label}
              </h3>
              <p className="mt-0.5 mb-2.5 text-xs text-muted-foreground">
                {MEASUREMENT_GROUP_META[group].hint}
              </p>

              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {rows.map((field) => (
                  <li
                    key={field.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[0.8125rem] font-medium text-foreground">
                        <span className={field.isActive ? "" : "line-through opacity-60"}>
                          {field.label}
                        </span>
                        {field.isCustom ? (
                          <Badge tone="accent">Yours</Badge>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        In {field.unit === "in" ? "inches" : "centimetres"}
                        {field.usageCount > 0
                          ? ` · recorded ${pluralise(field.usageCount, "time")}`
                          : " · never used yet"}
                      </p>
                    </div>

                    {canWrite ? (
                      <form action={toggleMeasurementFieldAction}>
                        <input type="hidden" name="id" value={field.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="xs"
                          title={
                            field.isActive
                              ? "Hide from the measurement form"
                              : "Show on the measurement form"
                          }
                        >
                          {field.isActive ? <EyeOff /> : <Eye />}
                          {field.isActive ? "Hide" : "Show"}
                        </Button>
                      </form>
                    ) : (
                      <Badge tone={field.isActive ? "positive" : "neutral"}>
                        {field.isActive ? "On the form" : "Hidden"}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add a measurement"
        description="It will appear on every measurement form from now on. Old records stay exactly as they were."
        size="sm"
      >
        <ActionForm action={addMeasurementFieldAction} className="space-y-5">
          <Field
            label="What do you call it?"
            htmlFor="field-label"
            hint="Whatever you say out loud when you measure it."
            required
            error={<FieldError name="label" />}
          >
            <Input
              id="field-label"
              name="label"
              placeholder="Sleeve at elbow"
              required
              autoComplete="off"
            />
          </Field>

          <Field label="Where does it belong?" htmlFor="field-group">
            <Select id="field-group" name="group" defaultValue="CUSTOM">
              {MEASUREMENT_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {MEASUREMENT_GROUP_META[group].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Measured in" htmlFor="field-unit">
            <Select id="field-unit" name="unit" defaultValue="in">
              {MEASUREMENT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === "in" ? "Inches" : "Centimetres"}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding…">Add measurement</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </div>
  );
}
