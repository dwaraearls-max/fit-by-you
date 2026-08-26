import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
      <Skeleton className="h-11 w-full sm:max-w-md" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-5">
        <SkeletonTable rows={8} />
      </div>
    </div>
  );
}
