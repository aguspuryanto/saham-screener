import { motion } from 'motion/react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HeatBar } from '../../components/ui/HeatBar';
import { ArrowDownRight, ArrowUpRight, Star, Bell, BellRing } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { formatRupiah, formatPercentSigned } from '../../../utils/format';
import { getRecommendationDisplay, getStarString, getWhySummary, getHeatScores } from '../../../utils/stockLabels';

interface StockCardProps {
  stock: Stock;
  index?: number;
  onClick?: (stock: Stock) => void;
  onSetNotification?: (stock: Stock) => void;
  hasNotification?: boolean;
  onToggleFavorite?: (stock: Stock) => void;
  isFavorite?: boolean;
}

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export function StockCard({ stock, index = 0, onClick, onSetNotification, hasNotification, onToggleFavorite, isFavorite }: StockCardProps) {
  const isPositive = stock.percentChange >= 0;
  const rec = getRecommendationDisplay(stock);
  const why = getWhySummary(stock);
  const heat = getHeatScores(stock);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.25 }}
    >
      <Card
        className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={() => onClick?.(stock)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Ticker/name + price */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">{stock.ticker}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(stock); }}
                  className={cn('p-1 rounded-full transition-colors', isFavorite ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600')}
                  title={isFavorite ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
                >
                  <Star className={cn('w-3.5 h-3.5', isFavorite && 'fill-emerald-600')} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{stock.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">{formatRupiah(stock.lastClose)}</div>
              <div className={cn('flex items-center justify-end gap-0.5 text-sm font-semibold tabular-nums', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {formatPercentSigned(stock.percentChange, 2)}
              </div>
            </div>
          </div>

          {/* Recommendation badge */}
          <div className={cn('rounded-xl px-3 py-2 flex items-center gap-2', VARIANT_STYLES[rec.variant])}>
            <span className="text-sm tracking-tight" aria-hidden>{getStarString(rec.stars)}</span>
            <span className="text-sm font-semibold">{rec.label}</span>
          </div>

          {/* Why summary */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">{why}</p>

          {/* Heat scores */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <HeatBar label="Momentum" value={heat.momentum} />
            <HeatBar label="Likuiditas" value={heat.likuiditas} />
            <HeatBar label="Fundamental" value={heat.fundamental} />
            <HeatBar label="Risiko Rendah" value={heat.risiko} />
          </div>

          {/* CTA row */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => onClick?.(stock)}>
              Cek Detail →
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); onSetNotification?.(stock); }}
              className={cn('p-2 rounded-lg transition-colors', hasNotification ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800')}
              title="Set Price Alert"
            >
              {hasNotification ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
