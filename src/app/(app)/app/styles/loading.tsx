import { Skeleton } from "@/components/ui/skeleton";

export default function StylesLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["w-16", "w-20", "w-24", "w-28", "w-20"].map((width, index) => (
          <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <Skeleton className="aspect-[3/4] w-full rounded-none" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
