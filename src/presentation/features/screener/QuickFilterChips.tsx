import { FilterOptions, DEFAULT_FILTERS } from './FilterSidebar';
import { cn } from '../../../utils/cn';

export type QuickFilterKey = 'all' | 'recommended' | 'momentum' | 'cheap' | 'swing' | 'scalping' | 'blueChip' | 'lowRisk';

interface QuickFilterPreset {
  key: QuickFilterKey;
  label: string;
  patch: Partial<FilterOptions>;
}

const PRESETS: QuickFilterPreset[] = [
  { key: 'all', label: 'Semua', patch: {} },
  { key: 'recommended', label: '🔥 Paling Direkomendasikan', patch: { recommendation: ['BUY'], minSwingScore: 70 } },
  { key: 'momentum', label: '🚀 Momentum', patch: { strategy: ['Momentum'] } },
  { key: 'cheap', label: '💰 Murah', patch: { undervalued: true } },
  { key: 'swing', label: '📈 Swing', patch: { minSwingScore: 60 } },
  { key: 'scalping', label: '⚡ Scalping', patch: { minScalpingScore: 60 } },
  { key: 'blueChip', label: '🏦 Blue Chip', patch: { blueChip: true } },
  { key: 'lowRisk', label: '🟢 Risiko Rendah', patch: { lowRisk: true } },
];

interface QuickFilterChipsProps {
  activeKey: QuickFilterKey;
  onSelect: (key: QuickFilterKey, filters: FilterOptions) => void;
}

export function QuickFilterChips({ activeKey, onSelect }: QuickFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible">
      {PRESETS.map((preset) => {
        const isActive = activeKey === preset.key;
        return (
          <button
            key={preset.key}
            onClick={() => onSelect(preset.key, { ...DEFAULT_FILTERS, ...preset.patch })}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border',
              isActive
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
