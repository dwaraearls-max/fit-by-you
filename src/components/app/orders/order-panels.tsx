"use client";

import * as React from "react";
import {
  CalendarPlus,
  CheckCircle2,
  MessageCircle,
  MessageSquarePlus,
  XCircle,
} from "lucide-react";

import { ActionForm, FieldError } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/dialog";
import { formatFriendlyDateTime, toDateTimeInputValue } from "@/lib/dates";
import { FITTING_STATUSES } from "@/lib/domain";
import {
  addOrderNoteAction,
  scheduleFittingAction,
  updateFittingStatusAction,
} from "@/server/order-actions";

export type FittingRow = {
  id: string;
  scheduledFor: Date;
  durationMinutes: number;
  status: string;
  notes: string | null;
  outcome: string | null;
  /** Pre-built `wa.me` link confirming the appointment, from the server. */
  whatsappHref?: string;
};

const FITTING_TONE: Record<string, "info" | "positive" | "critical" | "neutral"> = {
  SCHEDULED: "info",
  COMPLETED: "positive",
  MISSED: "critical",
  CANCELLED: "neutral",
};

export function FittingsPanel({
  orderId,
  fittings,
  suggestedDate,
  canEdit,
}: {
  orderId: string;
  fittings: FittingRow[];
  suggestedDate: Date | null;
  canEdit: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fittings</CardTitle>
            <CardDescription>
              {fittings.length === 0
                ? "Nothing scheduled yet."
                : `${fittings.length} on record.`}
            </CardDescription>
          </div>
          {canEdit ? (
            <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
              <CalendarPlus />
              Schedule
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {fittings.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Schedule a fitting and it appears on your calendar and in your
              Today panel on the morning it happens.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {fittings.map((fitting) => (
                <li key={fitting.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-foreground">
                        {formatFriendlyDateTime(fitting.scheduledFor)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fitting.durationMinutes} minutes
                        {fitting.notes ? ` · ${fitting.notes}` : ""}
                      </p>
                      {fitting.outcome ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {fitting.outcome}
                        </p>
                      ) : null}
                    </div>
                    <Badge size="sm" tone={FITTING_TONE[fitting.status] ?? "neutral"}>
                      {fitting.status.charAt(0) +
                        fitting.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  {canEdit && fitting.status === "SCHEDULED" ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {fitting.whatsappHref ? (
                        <Button asChild variant="ghost" size="xs">
                          <a
                            href={fitting.whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle />
                            Confirm
                          </a>
                        </Button>
                      ) : null}
                      {(["COMPLETED", "MISSED"] as const)
                        .filter((status) =>
                          (FITTING_STATUSES as readonly string[]).includes(status),
                        )
                        .map((status) => (
                          <form key={status} action={updateFittingStatusAction}>
                            <input type="hidden" name="fittingId" value={fitting.id} />
                            <input type="hidden" name="status" value={status} />
                            <Button type="submit" variant="ghost" size="xs">
                              {status === "COMPLETED" ? (
                                <>
                                  <CheckCircle2 />
                                  Happened
                                </>
                              ) : (
                                <>
                                  <XCircle />
                                  Missed
                                </>
                              )}
                            </Button>
                          </form>
                        ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Schedule a fitting"
        description="It goes straight onto your calendar."
      >
        <ActionForm action={scheduleFittingAction} className="space-y-5">
          <input type="hidden" name="orderId" value={orderId} />

          <Field
            label="Date and time"
            htmlFor="scheduledFor"
            required
            error={<FieldError name="scheduledFor" />}
          >
            <Input
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
              required
              defaultValue={toDateTimeInputValue(suggestedDate ?? new Date())}
            />
          </Field>

          <Field
            label="How long"
            htmlFor="durationMinutes"
            hint="In minutes."
            error={<FieldError name="durationMinutes" />}
          >
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={5}
              step={5}
              defaultValue={30}
              className="tabular"
            />
          </Field>

          <Field
            label="Notes"
            htmlFor="fittingNotes"
            error={<FieldError name="notes" />}
          >
            <Textarea
              id="fittingNotes"
              name="notes"
              rows={2}
              placeholder="Bring the shoes she will wear with it."
            />
          </Field>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" pendingLabel="Scheduling…">
              Schedule fitting
            </SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}

/** Adds a free-text entry to the order timeline. */
export function AddNotePanel({ orderId }: { orderId: string }) {
  return (
    <ActionForm action={addOrderNoteAction} bannerPosition="bottom">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Add to the timeline" htmlFor="note" error={<FieldError name="note" />}>
        <Textarea
          id="note"
          name="note"
          rows={2}
          placeholder="Fabric arrived. Started cutting the bodice."
        />
      </Field>
      <div className="mt-3 flex justify-end">
        <SubmitButton variant="outline" size="sm" pendingLabel="Adding…">
          <MessageSquarePlus />
          Add note
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
