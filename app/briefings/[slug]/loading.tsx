import { Skeleton } from "@/components/ui/skeleton";

export default function BriefingLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-2/3" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card p-6">
              <Skeleton className="mb-4 h-4 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
