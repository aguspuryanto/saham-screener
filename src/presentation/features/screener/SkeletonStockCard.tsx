import { Card, CardContent } from '../../components/ui/Card';

function Bone({ className = '' }: { className?: string }) {
  return <div className={`rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`} />;
}

export function SkeletonStockCard() {
  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-2">
            <Bone className="h-6 w-20" />
            <Bone className="h-4 w-28" />
          </div>
          <div className="space-y-2 text-right">
            <Bone className="h-6 w-24" />
            <Bone className="h-4 w-16" />
          </div>
        </div>
        <Bone className="h-9 w-full rounded-xl" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-1">
              <Bone className="h-3 w-16" />
              <Bone className="h-1.5 w-full" />
            </div>
          ))}
        </div>
        <Bone className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function SkeletonStockGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonStockCard key={i} />
      ))}
    </div>
  );
}
