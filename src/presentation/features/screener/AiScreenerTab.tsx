import { useMemo, useState } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { AiEngineOutput, AiScores } from '../../../domain/models/AiEngine';
import { cn } from '../../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { recommendationBadgeVariant, ScoreBar } from './aiEngineUi';
import { useAiScreener, AiScreenerStatus } from './useAiScreener';
import {
  Sparkles, TrendingUp, Zap, Star, ArrowUpRight, ArrowDownRight, RefreshCw, Info,
} from 'lucide-react';

interface AiScreenerTabProps {
  stocks: Stock[];
  loading: boolean;
  onStockClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  favorites: Set<string>;
}

const TOP_SCORE_KEYS: (keyof AiScores)[] = ['momentum', 'trend', 'smart_money'];

const SCORE_LABELS: Record<keyof AiScores, string> = {
  liquidity: 'Liquidity',
  momentum: 'Momentum',
  trend: 'Trend',
  volatility: 'Volatility',
  smart_money: 'Smart Money',
  distribution: 'Distribution',
  fundamental: 'Fundamental',
};

function StatusChip({ status, barsAvailable }: { status: AiScreenerStatus; barsAvailable?: number }) {
  if (status === 'idle') {
    return <span className="text-xs text-slate-400">Belum dianalisis</span>;
  }
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <RefreshCw className="w-3 h-3 animate-spin" /> Menganalisis...
      </span>
    );
  }
  if (status === 'no-history') {
    return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Riwayat tidak tersedia</span>;
  }
  if (status === 'insufficient-bars') {
    return (
      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
        Data {'<'} 60 hari{barsAvailable != null ? ` (tersedia ${barsAvailable})` : ''}
      </span>
    );
  }
  return null;
}

interface AiScreenerCardProps {
  rank: number;
  stock: Stock;
  status: AiScreenerStatus;
  output: AiEngineOutput | null;
  onClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  isFavorite: boolean;
}

function AiScreenerCard({ rank, stock, status, output, onClick, onToggleFavorite, isFavorite }: AiScreenerCardProps) {
  const isPositive = stock.percentChange >= 0;

  const rankBg =
    rank === 1 ? 'bg-amber-400 text-white' :
    rank === 2 ? 'bg-slate-400 text-white' :
    rank === 3 ? 'bg-amber-600 text-white' :
    'bg-slate-100 text-slate-600';

  return (
    <div
      onClick={() => onClick(stock)}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg}`}>
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">{stock.ticker}</span>
              <span className={cn(
                'flex items-center text-xs font-semibold',
                isPositive ? 'text-emerald-600' : 'text-red-500'
              )}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stock.percentChange).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[160px]">{stock.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(stock); }}
            className={cn('p-1.5 rounded-full transition-colors', isFavorite ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-slate-500')}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-emerald-600' : ''}`} />
          </button>
          {output && (
            <Badge variant={recommendationBadgeVariant(output.recommendation)} className="text-xs px-2.5 py-1">
              {output.recommendation}
            </Badge>
          )}
        </div>
      </div>

      {!output ? (
        <div className="py-2">
          <StatusChip status={status} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Trend: {output.trend_category}</span>
            <span>Confidence {output.confidence}%</span>
          </div>

          {/* Top score bars */}
          <div className="space-y-1.5 mb-3">
            {TOP_SCORE_KEYS.map((key) => (
              <ScoreBar key={key} label={SCORE_LABELS[key]} value={output.scores[key]} />
            ))}
          </div>

          {/* Swing probability */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3 pt-3 border-t border-slate-100">
            <div>
              <div className="text-slate-400 mb-0.5">TP Prob (Swing)</div>
              <div className="font-semibold text-emerald-600">{output.swing_probability.take_profit}%</div>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">SL Prob (Swing)</div>
              <div className="font-semibold text-red-500">{output.swing_probability.stop_loss}%</div>
            </div>
          </div>

          {/* Trading levels */}
          <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-400 mb-0.5">Entry</div>
              <div className="font-semibold text-blue-600 text-xs leading-tight">{output.entry.toLocaleString('id-ID')}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">Target</div>
              <div className="font-semibold text-emerald-600 text-xs leading-tight">
                {output.take_profit[0]?.toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-0.5">Stop</div>
              <div className="font-semibold text-red-500 text-xs leading-tight">{output.stop_loss.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AiScreenerTab({ stocks, loading, onStockClick, onToggleFavorite, favorites }: AiScreenerTabProps) {
  const [candidateBasis, setCandidateBasis] = useState<'swing' | 'scalping'>('swing');
  const [topN] = useState(20);
  const { results, statusByTicker, progress, isRunning, run } = useAiScreener();

  const candidates = useMemo(() => {
    return [...stocks]
      .sort((a, b) => {
        const scoreA = candidateBasis === 'swing' ? a.swingScore.totalScore : a.scalpingScore.totalScore;
        const scoreB = candidateBasis === 'swing' ? b.swingScore.totalScore : b.scalpingScore.totalScore;
        return scoreB - scoreA;
      })
      .slice(0, topN);
  }, [stocks, candidateBasis, topN]);

  const hasRunForCandidates = candidates.some((s) => statusByTicker.has(s.ticker));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-4">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Memuat data saham...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Candidate basis selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCandidateBasis('swing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all',
            candidateBasis === 'swing'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <TrendingUp className={cn('w-5 h-5', candidateBasis === 'swing' ? 'text-emerald-600' : 'text-slate-400')} />
          <div className="text-left">
            <div className="font-bold">Kandidat dari Swing Score</div>
            <div className="text-xs font-normal opacity-70">Top {topN}</div>
          </div>
        </button>
        <button
          onClick={() => setCandidateBasis('scalping')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all',
            candidateBasis === 'scalping'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <Zap className={cn('w-5 h-5', candidateBasis === 'scalping' ? 'text-violet-600' : 'text-slate-400')} />
          <div className="text-left">
            <div className="font-bold">Kandidat dari Scalping Score</div>
            <div className="text-xs font-normal opacity-70">Top {topN}</div>
          </div>
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm bg-indigo-50 border border-indigo-100 text-indigo-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>AI Screener:</strong> Menjalankan AI Engine (indikator teknikal riil + rule engine + probabilitas) pada Top {topN} kandidat di atas.
          Analisis butuh riwayat harga harian per saham, jadi dijalankan atas permintaan — bukan otomatis untuk semua saham.
        </p>
      </div>

      {/* Run button / progress */}
      <div className="flex items-center justify-between mb-5 bg-white rounded-xl border border-slate-200 p-3.5">
        <div className="text-sm text-slate-600">
          {isRunning
            ? `Menganalisis ${progress.done}/${progress.total} saham...`
            : hasRunForCandidates
              ? 'Analisis selesai. Klik lagi untuk memuat ulang.'
              : `Siap menganalisis ${candidates.length} saham kandidat.`}
        </div>
        <button
          onClick={() => run(candidates)}
          disabled={isRunning || candidates.length === 0}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            isRunning
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          <Sparkles className={cn('w-4 h-4', isRunning && 'animate-pulse')} />
          Analisa dengan AI Engine
        </button>
      </div>

      {isRunning && progress.total > 0 && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidates.map((stock, i) => (
          <AiScreenerCard
            key={stock.id}
            rank={i + 1}
            stock={stock}
            status={statusByTicker.get(stock.ticker) ?? 'idle'}
            output={results.get(stock.ticker) ?? null}
            onClick={onStockClick}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.has(stock.id)}
          />
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Data sedang dimuat. Silakan refresh.</p>
        </div>
      )}
    </div>
  );
}
