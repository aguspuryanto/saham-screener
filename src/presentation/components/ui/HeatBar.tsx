import { cn } from '../../../utils/cn';

interface HeatBarProps {
  label: string;
  value: number; // 0-100, higher is always "better" for the given label
}

const SEGMENTS = 5;

export function HeatBar({ label, value }: HeatBarProps) {
  const filled = Math.round((value / 100) * SEGMENTS);
  const colorClass =
    value >= 70 ? 'bg-emerald-500' :
    value >= 40 ? 'bg-slate-400 dark:bg-slate-500' :
    'bg-red-400';

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="grid grid-cols-5 gap-0.5" role="img" aria-label={`${label}: ${value} dari 100`}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={cn('h-1.5 rounded-full', i < filled ? colorClass : 'bg-slate-100 dark:bg-slate-700')}
          />
        ))}
      </div>
    </div>
  );
}
