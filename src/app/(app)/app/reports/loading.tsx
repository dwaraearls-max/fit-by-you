import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-36" />
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

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <SkeletonText className="mt-5" lines={5} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 xl:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-64 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <Skeleton className="h-4 w-32" />
          <SkeletonText className="mt-5" lines={6} />
        </div>
      </div>
    </div>
  );
}
