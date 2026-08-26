"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/field";

/**
 * The two-date selector for Compare Measurements. Kept in the URL so a
 * comparison can be linked to, and so the diff itself renders on the server.
 */
export function ComparePicker({
  sessions,
  from,
  to,
}: {
  sessions: { id: string; label: string }[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const go = (key: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor="compare-from"
          className="block text-[0.8125rem] font-medium text-foreground"
        >
          Earlier session
        </label>
        <Select
          id="compare-from"
          value={from}
          onChange={(event) => go("from", event.target.value)}
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="compare-to"
          className="block text-[0.8125rem] font-medium text-foreground"
        >
          Later session
        </label>
        <Select
          id="compare-to"
          value={to}
          onChange={(event) => go("to", event.target.value)}
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
