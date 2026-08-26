import { Download, FileJson, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";

const CSV_TABLES = [
  { table: "customers", label: "Customers", hint: "Names, contacts, totals" },
  { table: "measurements", label: "Measurements", hint: "Every measurement ever taken" },
  { table: "orders", label: "Orders", hint: "Outfits, dates, prices, balances" },
  { table: "payments", label: "Payments", hint: "Every payment and receipt" },
];

/**
 * Server component: these are plain links, so a download does not need a
 * client bundle. Data portability is a promise, not a feature to gate.
 */
export function ExportPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileJson className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">Everything, in one file</h3>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Your whole business as a single JSON file: customers, every
              measurement session, orders, timelines, fittings, payments,
              appointments and your style library. This is a complete copy, not a
              summary.
            </p>
            <Button asChild variant="primary" size="sm" className="mt-4">
              <a href="/api/export?format=json" download>
                <Download />
                Download everything
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileSpreadsheet
            className="mt-0.5 size-4 shrink-0 text-subtle-foreground"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">
              One table at a time, for Excel
            </h3>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Spreadsheet files you can open, sort and print. Useful for
              stocktakes, accountants, and anyone who wants the numbers on paper.
            </p>

            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {CSV_TABLES.map((entry) => (
                <li key={entry.table}>
                  <a
                    href={`/api/export?format=csv&table=${entry.table}`}
                    download
                    className="flex items-center gap-3 rounded-lg border border-border-strong bg-surface px-3.5 py-3 transition-colors hover:border-ink-300 hover:bg-surface-muted/60"
                  >
                    <Download className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] font-medium text-foreground">
                        {entry.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.hint}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Amounts in the exports are written in whole units of your currency, and
        measurements in the unit each was taken in. Every export is recorded in
        your activity log.
      </p>
    </div>
  );
}
