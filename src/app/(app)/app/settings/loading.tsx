import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>

      <div className="mb-6 flex gap-4 border-b border-border pb-3">
        {["w-16", "w-24", "w-12", "w-28", "w-20"].map((width) => (
          <Skeleton key={width} className={`h-4 ${width}`} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3.5 w-72" />

        <div className="mt-6 space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            </div>
          ))}
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}
