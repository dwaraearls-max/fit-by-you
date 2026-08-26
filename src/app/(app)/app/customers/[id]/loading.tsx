import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerProfileLoading() {
  return (
    <div className="mx-auto max-w-[84rem]">
      <Skeleton className="h-3.5 w-24" />

      <div className="mt-4 flex items-start gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-5 border-b border-border pb-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-accent-border bg-accent-soft/50 p-6">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-5 h-7 w-72" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
