import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SnippetsSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  return (
    <div
      className={cn(
        "grid gap-6",
        layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex-1 space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="size-5 rounded" />
            </div>
            <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-black/20 px-5 py-2.5">
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-1">
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
