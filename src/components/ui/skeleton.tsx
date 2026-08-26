import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonStatRow({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-4 h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFormPage({
  wide = true,
  fields = 6,
}: {
  wide?: boolean;
  fields?: number;
}) {
  return (
    <div className={cn("mx-auto", wide ? "max-w-3xl" : "max-w-xl")}>
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="space-y-5">
          {Array.from({ length: fields }).map((_, index) => (
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

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
