import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent } from '../../components/ui/Card';
import { HeatBar } from '../../components/ui/HeatBar';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '../../../utils/cn';
import {
  getRecommendationDisplay,
  getStarString,
  getWhySummary,
  getHeatScores,
  getValuationLabel,
} from '../../../utils/stockLabels';

interface DetailSummaryTabProps {
  stock: Stock;
}

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export function DetailSummaryTab({ stock }: DetailSummaryTabProps) {
  const rec = getRecommendationDisplay(stock);
  const why = getWhySummary(stock);
  const heat = getHeatScores(stock);
  const valuation = getValuationLabel(stock);
  const kelebihan = [...stock.swingScore.signals, ...stock.scalpingScore.signals].slice(0, 4);
  const isSafer = heat.risiko >= 60;

  return (
    <div className="space-y-4">
      {/* Rekomendasi besar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-5">
          <div className={cn('rounded-xl px-4 py-3 flex items-center gap-3', VARIANT_STYLES[rec.variant])}>
            <span className="text-lg tracking-tight" aria-hidden>{getStarString(rec.stars)}</span>
            <span className="text-base font-bold">{rec.label}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{why}</p>
        </CardContent>
      </Card>

      {/* Kelebihan */}
      {kelebihan.length > 0 && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Kelebihan
            </h3>
            <ul className="space-y-1.5">
              {kelebihan.map((signal, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300">{signal}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risiko */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            {isSafer ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
            Risiko
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isSafer
              ? 'Saham ini relatif stabil — pergerakan harganya tidak terlalu liar dibanding rata-rata pasar.'
              : 'Saham ini cenderung fluktuatif — cocok untuk yang siap menerima naik-turun harga yang lebih tajam.'}
          </p>
        </CardContent>
      </Card>

      {/* Momentum & valuasi (heat bars) */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Momentum & Valuasi</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <HeatBar label="Momentum" value={heat.momentum} />
            <HeatBar label="Likuiditas" value={heat.likuiditas} />
            <HeatBar label="Fundamental" value={heat.fundamental} />
            <HeatBar label="Risiko Rendah" value={heat.risiko} />
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Valuasi saat ini</span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">{valuation}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Ingin lihat data teknikal & fundamental lengkap? Buka tab lain di atas.
      </p>
    </div>
  );
}
