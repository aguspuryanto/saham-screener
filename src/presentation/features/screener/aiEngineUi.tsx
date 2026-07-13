import { AiRecommendation } from '../../../domain/models/AiEngine';

export function recommendationBadgeVariant(rec: AiRecommendation): 'success' | 'warning' | 'neutral' | 'danger' {
  switch (rec) {
    case 'BUY':
      return 'success';
    case 'WATCHLIST':
      return 'warning';
    case 'WAIT':
      return 'neutral';
    case 'AVOID':
      return 'danger';
  }
}

export function scoreBarColor(score: number, invert: boolean): string {
  const effective = invert ? 100 - score : score;
  if (effective >= 70) return 'bg-emerald-500';
  if (effective >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarColor(value, invert)}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
