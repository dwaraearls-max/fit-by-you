import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            >
              <Skeleton className="h-4 w-28" />
              <SkeletonText className="mt-5" lines={4} />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6"
            >
              <Skeleton className="h-4 w-24" />
              <SkeletonText className="mt-5" lines={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
