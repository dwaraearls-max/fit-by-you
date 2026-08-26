"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/field";
import { saveCustomerNotesAction } from "@/server/customer-actions";

export function NotesTab({
  customerId,
  notes,
  canEdit,
}: {
  customerId: string;
  notes: string | null;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {notes?.trim() || "No notes yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            The things you would otherwise try to remember. These also appear in
            Fit Memory.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ActionForm action={saveCustomerNotesAction} bannerPosition="bottom">
          <input type="hidden" name="customerId" value={customerId} />
          <Textarea
            name="notes"
            rows={10}
            defaultValue={notes ?? ""}
            placeholder={
              "Likes her sleeves a little longer than standard.\nAlways collects on Saturdays.\nReferred by Ama at the salon."
            }
          />
          <div className="mt-4 flex justify-end">
            <SubmitButton variant="primary" size="sm" pendingLabel="Saving…">
              Save notes
            </SubmitButton>
          </div>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
