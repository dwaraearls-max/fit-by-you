import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function ReceiptLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-64" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="size-10 rounded-md" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="mt-8 h-7 w-48" />
        <SkeletonText className="mt-6" lines={8} />
        <div className="mt-8 flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </div>
  );
}
