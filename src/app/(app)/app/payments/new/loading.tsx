import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function NewPaymentLoading() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <SkeletonText lines={2} />
        <div className="mt-6 space-y-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
