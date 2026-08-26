import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function MeasurementsLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 flex-1 rounded-md sm:max-w-sm" />
        <Skeleton className="h-11 w-36 rounded-md" />
      </div>

      <SkeletonTable rows={8} />
    </div>
  );
}
