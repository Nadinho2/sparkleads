import { Skeleton } from '@/components/ui';

export default function AffiliateLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-surface">
            <Skeleton className="w-10 h-10 rounded-lg mb-3" />
            <Skeleton className="h-7 w-20 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl border border-border bg-surface">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-3 mb-4">
          <Skeleton className="flex-1 h-[52px] rounded-lg" />
          <Skeleton className="w-28 h-[52px] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-surface text-center">
              <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-3" />
              <Skeleton className="h-5 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl border border-border bg-surface">
        <Skeleton className="h-6 w-36 mb-4" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-surface">
              <Skeleton className="h-5 w-36 mb-3" />
              <Skeleton className="h-16 w-full rounded-lg mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
