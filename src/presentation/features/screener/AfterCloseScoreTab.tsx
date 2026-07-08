import { useMemo } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { computeAfterCloseScore, WATCHLIST_THRESHOLD } from '../../../domain/engine/afterCloseScore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, Moon, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useStockHistory } from './useStockHistory';

interface AfterCloseScoreTabProps {
  stock: Stock;
  allStocks?: Stock[];
}

function scoreBarColor(ratio: number): string {
  if (ratio >= 1) return 'bg-emerald-500';
  if (ratio >= 0.5) return 'bg-amber-500';
  return 'bg-red-500';
}

const MORNING_CHECKLIST = [
  'Volume 15 menit pertama tinggi.',
  'Bid lebih tebal daripada offer.',
  'Tidak dibuka gap up berlebihan (>5%).',
  'Harga bertahan di atas VWAP atau harga pembukaan.',
];

export function AfterCloseScoreTab({ stock, allStocks = [] }: AfterCloseScoreTabProps) {
  const history = useStockHistory(stock.ticker);

  const result = useMemo(() => {
    if (!history.ok || history.bars.length === 0) return null;
    return computeAfterCloseScore(stock, history.bars, allStocks);
  }, [stock, allStocks, history.ok, history.bars]);

  if (history.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Memuat riwayat harga {stock.ticker}...</p>
      </div>
    );
  }

  if (!history.ok || history.bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center px-6">
        <Moon className="w-8 h-8 mb-3 text-slate-300" />
        <p className="font-medium">Riwayat harga tidak tersedia untuk saham ini.</p>
        <p className="text-sm mt-1">After Close Score memerlukan data historis harian untuk menghitung resistance, MACD, EMA, dan RSI.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center px-6">
        <Moon className="w-8 h-8 mb-3 text-slate-300" />
        <p className="font-medium">Data historis belum cukup untuk After Close Score.</p>
        <p className="text-sm mt-1">
          Minimum 60 hari data diperlukan, saat ini tersedia {history.bars.length} hari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={cn('border-2', result.eligible ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-5 h-5 text-indigo-500" />
              <CardTitle>After Close Score</CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              Screening setelah market tutup (15.30–21.00) untuk watchlist eksekusi besok pagi.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-900">
              {result.total}<span className="text-base font-medium text-slate-400">/{result.maxTotal}</span>
            </div>
            <Badge variant={result.eligible ? 'success' : 'neutral'} className="mt-1">
              {result.eligible ? `Masuk Watchlist (>=${WATCHLIST_THRESHOLD})` : `Belum Memenuhi Ambang ${WATCHLIST_THRESHOLD}`}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown 9 Indikator (Skor 100)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Broker Summary (Net Buy) dihilangkan karena data broker tidak tersedia dari API — bobotnya sudah didistribusikan ke 9 indikator berikut.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.criteria.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{c.label}</span>
                <span className="font-semibold text-slate-900">{c.score}/{c.weight}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-1">
                <div
                  className={cn('h-full rounded-full', scoreBarColor(c.weight > 0 ? c.score / c.weight : 0))}
                  style={{ width: `${c.weight > 0 ? Math.min(100, (c.score / c.weight) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{c.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formula Screening (Semua Harus Terpenuhi)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Value ≥20M AND RVOL ≥2 AND MACD Bullish AND EMA Golden AND RSI 60–80 AND Kenaikan 1 Minggu ≤15% AND Breakout Resistance AND Risk:Reward ≥1:2.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.gates.map((g, i) => (
              <li key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span className="flex items-center gap-2 text-slate-700">
                  {g.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {g.label}
                </span>
                <span className={cn('font-semibold', g.passed ? 'text-emerald-600' : 'text-red-500')}>{g.detail}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 p-3 rounded-lg border text-sm font-semibold text-center"
            style={result.gatesPassed
              ? { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', color: '#047857' }
              : { borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#b91c1c' }}
          >
            {result.gatesPassed ? 'Semua syarat terpenuhi — layak masuk watchlist untuk esok hari' : 'Belum semua syarat terpenuhi'}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base">Konfirmasi Saat Pagi (09.00–09.15)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Lolos screening malam bukan jaminan entry — tunggu konfirmasi ini sebelum eksekusi.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            {MORNING_CHECKLIST.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
