import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-sm" />
          <Skeleton className="size-8 rounded-sm" />
          <Skeleton className="ml-2 h-6 w-36" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted/50">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="px-2 py-3">
              <Skeleton className="mx-auto h-2.5 w-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="min-h-20 space-y-2 border-r border-b border-border p-2 sm:min-h-28"
            >
              <Skeleton className="size-6 rounded-full" />
              {index % 3 === 0 ? <Skeleton className="h-4 w-full" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
