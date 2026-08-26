import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <div className="mb-8">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>

      <Skeleton className="h-10 w-full sm:max-w-md" />

      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="mt-5">
        <SkeletonTable rows={8} />
      </div>
    </div>
  );
}
