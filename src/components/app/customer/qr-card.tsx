"use client";

import * as React from "react";
import { Printer, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";

/**
 * The printable customer card. A tailor prints it, the customer keeps it, and
 * scanning it opens the profile — no searching, no spelling out surnames.
 */
export function QrCard({
  customerId,
  customerName,
  customerCode,
  businessName,
  phone,
}: {
  customerId: string;
  customerName: string;
  customerCode: string;
  businessName: string;
  phone: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <QrCode />
        Customer card
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Customer card"
        description="Print this and give it to your customer. Scanning it opens their profile straight away."
      >
        <div className="no-print flex justify-end pb-4">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
        </div>

        <div className="mx-auto w-full max-w-xs rounded-xl border border-border bg-surface p-6 text-center shadow-xs">
          <p className="eyebrow text-subtle-foreground">{businessName}</p>

          <div className="mx-auto mt-5 flex size-40 items-center justify-center rounded-lg bg-white p-2">
            {/* Generated on demand by the authorising route handler. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${customerId}`}
              alt={`QR code for ${customerName}`}
              width={144}
              height={144}
              className="size-36"
            />
          </div>

          <p className="mt-5 text-base font-semibold tracking-tight text-foreground">
            {customerName}
          </p>
          <p className="tabular mt-1 text-xs text-muted-foreground">{customerCode}</p>
          <p className="tabular mt-0.5 text-xs text-muted-foreground">{phone}</p>

          <p className="display mt-5 text-[0.6875rem] text-subtle-foreground">
            Your Fashion Business Has a Memory.
          </p>
        </div>
      </Modal>
    </>
  );
}
