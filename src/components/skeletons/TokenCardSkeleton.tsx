import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const TokenCardSkeleton = () => {
  return (
    <Card className="p-2 border-border">
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
          {/* Token image skeleton */}
          <Skeleton className="w-12 h-12 rounded-full" />
          {/* Progress ring skeleton */}
          <div className="absolute inset-0 w-14 h-14">
            <Skeleton className="w-full h-full rounded-full" />
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            {/* Token symbol */}
            <Skeleton className="h-4 w-16" />
            {/* Token name */}
            <Skeleton className="h-3 w-24" />
            {/* Copy button */}
            <Skeleton className="h-3 w-3 rounded" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center flex-grow">
              {/* Time ago */}
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-baseline gap-2">
              {/* Volume and market cap */}
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Progress info */}
            <Skeleton className="h-3 w-16" />
            {/* Transaction count */}
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TokenCardSkeletonMyTokens = () => {
  return (
    <Card className="p-4 sm:p-3 border-border">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
          {/* Token image skeleton */}
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex flex-col gap-1 min-w-0">
            {/* Token symbol */}
            <Skeleton className="h-4 sm:h-5 w-16" />
            <div className="flex items-center gap-2">
              {/* Token name */}
              <Skeleton className="h-3 sm:h-4 w-20" />
              {/* Copy button */}
              <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2">
            {/* Social links skeletons */}
            <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded" />
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}; 