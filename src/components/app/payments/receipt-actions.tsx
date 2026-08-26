"use client";

import { MessageCircle, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "@/server/payment-actions";

export function ReceiptActions({
  paymentId,
  whatsappHref,
  canDelete,
}: {
  paymentId: string;
  whatsappHref: string;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer />
        Print
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle />
          Send on WhatsApp
        </a>
      </Button>
      {canDelete ? (
        <form
          action={deletePaymentAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Remove this payment? The outfit's balance will go back up.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="paymentId" value={paymentId} />
          <Button type="submit" variant="ghost" size="sm">
            <Trash2 />
            Remove
          </Button>
        </form>
      ) : null}
    </div>
  );
}
