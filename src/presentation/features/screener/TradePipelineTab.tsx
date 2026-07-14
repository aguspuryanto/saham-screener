import { useMemo } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { WatchlistTier } from '../../../domain/models/Watchlist';
import { computeWatchlistOutput } from '../../../domain/engine/watchlistEngine';
import { computeTradeEngineOutput } from '../../../domain/engine/tradeEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreBar } from './aiEngineUi';
import { TradeEngineCard } from './TradeEngineCard';
import { useStockHistory } from './useStockHistory';
import { Loader2, Waypoints, Hourglass, XCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TradePipelineTabProps {
  stock: Stock;
}

const TIER_LABEL: Record<WatchlistTier, string> = {
  ELITE: 'Elite Watchlist',
  VERY_GOOD: 'Very Good',
  WORTH_WATCHING: 'Worth Watching',
  NO_TRADE: 'No Trade',
};

function tierBadgeVariant(tier: WatchlistTier): 'success' | 'warning' | 'danger' {
  if (tier === 'ELITE' || tier === 'VERY_GOOD') return 'success';
  if (tier === 'WORTH_WATCHING') return 'warning';
  return 'danger';
}

export function TradePipelineTab({ stock }: TradePipelineTabProps) {
  const history = useStockHistory(stock.ticker);

  const watchlist = useMemo(() => {
    if (!history.ok || history.bars.length === 0) return null;
    return computeWatchlistOutput(stock, history.bars);
  }, [stock, history.ok, history.bars]);

  const execution = useMemo(() => {
    if (!history.ok || history.bars.length === 0) return null;
    return computeTradeEngineOutput(stock, history.bars);
  }, [stock, history.ok, history.bars]);

  if (history.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Memuat riwayat harga {stock.ticker}...</p>
      </div>
    );
  }

  if (!history.ok || history.bars.length === 0 || !watchlist) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center px-6">
        <Waypoints className="w-8 h-8 mb-3 text-slate-300" />
        <p className="font-medium">Data historis tidak cukup untuk Trade Pipeline.</p>
        <p className="text-sm mt-1">Minimum 60 hari data diperlukan.</p>
      </div>
    );
  }

  const finalStatus = watchlist.tier === 'NO_TRADE' ? 'NO_TRADE' : 'AWAITING_OPENING';

  return (
    <div className="space-y-6">
      {/* Final decision banner */}
      <Card
        className={cn(
          'border-2',
          finalStatus === 'NO_TRADE' ? 'border-red-300 bg-red-50/40' : 'border-amber-300 bg-amber-50/40'
        )}
      >
        <CardContent className="py-4 flex items-center gap-3">
          {finalStatus === 'NO_TRADE' ? (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          ) : (
            <Hourglass className="w-6 h-6 text-amber-600 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold text-slate-900">
              {finalStatus === 'NO_TRADE' ? '⚫ No Trade' : '🟡 Menunggu Validasi Opening'}
            </p>
            <p className="text-sm text-slate-600">
              {finalStatus === 'NO_TRADE'
                ? 'Stage 1 (After Market) tidak lolos ambang watchlist — tidak direkomendasikan untuk dipantau besok.'
                : 'Stage 1 (After Market) lolos watchlist. Status tidak akan pernah otomatis menjadi "Siap Dieksekusi" di aplikasi ini karena Stage 2 (Opening) belum terhubung ke data real-time — validasi manual di 08:55-09:10 tetap wajib.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stage 1: After Market */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Stage 1 — After Market AI</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900">{watchlist.finalScore}<span className="text-sm text-slate-400">/100</span></div>
            <Badge variant={tierBadgeVariant(watchlist.tier)} className="mt-1">{TIER_LABEL[watchlist.tier]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar label="Momentum (30%)" value={watchlist.categories.momentum} />
          <ScoreBar label="Liquidity (25%)" value={watchlist.categories.liquidity} />
          <ScoreBar label="Smart Money (20%)" value={watchlist.categories.smartMoney} />
          <ScoreBar label="Structure (15%)" value={watchlist.categories.structure} />
          <ScoreBar label="Risk (10%)" value={watchlist.categories.risk} />
          {watchlist.penalties.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-red-600 mb-1">Penalty diterapkan:</p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {watchlist.penalties.map((p, i) => (
                  <li key={i}>-{p.points} {p.label} ({p.detail})</li>
                ))}
              </ul>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100">
            <ul className="text-xs text-slate-600 space-y-1">
              {watchlist.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stage 2: Opening (placeholder) */}
      <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base text-slate-500">Stage 2 — Opening AI (08:55–09:10)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            ⏳ <strong>Belum tersedia.</strong> Tahap ini butuh data real-time: bid/offer queue, volume &amp; value 5
            menit pertama, VWAP, dan broker top buyer/seller. Aplikasi ini tidak memiliki feed data tersebut (hanya
            data EOD harian dari Yahoo Finance / pasardana.id). Validasi manual saat jam bukaan tetap diperlukan
            sebelum entry apapun.
          </p>
        </CardContent>
      </Card>

      {/* Stage 3: Execution (EOD preview, reuses TradeEngineCard) */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-3 px-1">Stage 3 — Execution AI (Preview EOD)</h3>
        {execution ? (
          <TradeEngineCard output={execution} />
        ) : (
          <Card><CardContent className="py-6 text-sm text-slate-500">Data tidak cukup untuk preview eksekusi.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
