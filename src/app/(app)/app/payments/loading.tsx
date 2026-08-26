import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-4 h-7 w-28" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Skeleton className="h-11 w-full sm:max-w-md" />
          <SkeletonTable rows={7} />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border bg-surface p-5"
            >
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
