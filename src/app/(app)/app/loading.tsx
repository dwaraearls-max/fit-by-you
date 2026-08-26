import {
  Skeleton,
  SkeletonStatRow,
  SkeletonTable,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-8">
        <Skeleton className="h-2.5 w-40" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <SkeletonStatRow />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 xl:col-span-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-56 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <Skeleton className="h-4 w-20" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SkeletonTable rows={5} />
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
