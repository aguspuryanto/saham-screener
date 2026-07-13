import { SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <SearchX className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">Tidak ada saham yang cocok</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
        Filter kamu mungkin terlalu ketat. Coba longgarkan sedikit dan lihat lagi.
      </p>
      <Button variant="outline" onClick={onReset}>
        Longgarkan Filter
      </Button>
    </div>
  );
}
