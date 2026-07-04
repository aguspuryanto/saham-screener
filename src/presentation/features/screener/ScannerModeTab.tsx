import React, { useState, useMemo } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { cn } from '../../../utils/cn';
import {
  TrendingUp, Zap, ChevronRight, ArrowUpRight, ArrowDownRight,
  Target, Shield, Star, BarChart2, Info, RefreshCw
} from 'lucide-react';

interface ScannerModeTabProps {
  stocks: Stock[];
  loading: boolean;
  onStockClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  favorites: Set<string>;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#10b981' :
    score >= 55 ? '#3b82f6' :
    score >= 35 ? '#f59e0b' :
    '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.28} fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  );
}

interface ScannerCardProps {
  rank: number;
  stock: Stock;
  mode: 'swing' | 'scalping';
  onClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  isFavorite: boolean;
}

const ScannerCard: React.FC<ScannerCardProps> = ({
  rank,
  stock,
  mode,
  onClick,
  onToggleFavorite,
  isFavorite,
}) => {
  const score = mode === 'swing' ? stock.swingScore : stock.scalpingScore;
  const levels = mode === 'swing' ? stock.swingLevels : stock.scalpingLevels;
  const isPositive = stock.percentChange >= 0;

  const scoreColor =
    score.totalScore >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    score.totalScore >= 55 ? 'text-blue-600 bg-blue-50 border-blue-200' :
    score.totalScore >= 35 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200';

  const rankBg =
    rank === 1 ? 'bg-amber-400 text-white' :
    rank === 2 ? 'bg-slate-400 text-white' :
    rank === 3 ? 'bg-amber-600 text-white' :
    'bg-slate-100 text-slate-600';

  return (
    <div
      onClick={() => onClick(stock)}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
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
          <div className={cn('px-2.5 py-1 rounded-lg border text-xs font-bold', scoreColor)}>
            Skor {score.totalScore}
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-1.5 mb-3">
        {mode === 'swing' ? (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
              <span>Breakdown Skor Swing</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Momentum</span>
                <ScoreBar score={(stock.swingScore as any).momentumScore} color="bg-blue-400" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Breakout</span>
                <ScoreBar score={(stock.swingScore as any).breakoutScore} color="bg-emerald-400" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Volume Spike</span>
                <ScoreBar score={(stock.swingScore as any).volumeScore} color="bg-violet-400" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Fundamental</span>
                <ScoreBar score={(stock.swingScore as any).fundamentalScore} color="bg-amber-400" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
              <span>Breakdown Skor Scalping</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Volatilitas</span>
                <ScoreBar score={(stock.scalpingScore as any).volatilityScore} color="bg-orange-400" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Momentum</span>
                <ScoreBar score={(stock.scalpingScore as any).momentumScore} color="bg-blue-400" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 w-24">Volume</span>
                <ScoreBar score={(stock.scalpingScore as any).volumeScore} color="bg-violet-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Signals */}
      {score.signals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {score.signals.slice(0, 3).map((sig, i) => (
            <span key={i} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
              {sig}
            </span>
          ))}
        </div>
      )}

      {/* Price & Trading Levels */}
      <div className="border-t border-slate-100 pt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="text-slate-400 mb-0.5">Harga</div>
          <div className="font-semibold text-slate-800 text-xs leading-tight">
            {stock.lastClose.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Entry</div>
          <div className="font-semibold text-blue-600 text-xs leading-tight">
            {levels.entry.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Target</div>
          <div className="font-semibold text-emerald-600 text-xs leading-tight">
            {levels.target1.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <div className="text-slate-400 mb-0.5">Stop</div>
          <div className="font-semibold text-red-500 text-xs leading-tight">
            {levels.stopLoss.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Multi-period changes */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">
        {[
          { label: '1H', val: stock.oneDay },
          { label: '1M', val: stock.oneWeek },
          { label: '1B', val: stock.oneMonth },
          { label: '3B', val: stock.threeMonth },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-50 rounded py-1">
            <div className="text-slate-400 text-xs">{label}</div>
            <div className={cn('font-semibold text-xs', val >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {val >= 0 ? '+' : ''}{val.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ScannerModeTab({ stocks, loading, onStockClick, onToggleFavorite, favorites }: ScannerModeTabProps) {
  const [activeMode, setActiveMode] = useState<'swing' | 'scalping'>('swing');
  const [topN] = useState(10);

  const topSwing = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.swingScore.totalScore - a.swingScore.totalScore)
      .slice(0, topN);
  }, [stocks, topN]);

  const topScalping = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.scalpingScore.totalScore - a.scalpingScore.totalScore)
      .slice(0, topN);
  }, [stocks, topN]);

  const displayList = activeMode === 'swing' ? topSwing : topScalping;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl mb-4">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Memuat dan menganalisis {stocks.length || '...'} saham...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mode Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveMode('swing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all',
            activeMode === 'swing'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <TrendingUp className={cn('w-5 h-5', activeMode === 'swing' ? 'text-emerald-600' : 'text-slate-400')} />
          <div className="text-left">
            <div className="font-bold">Swing Trade</div>
            <div className="text-xs font-normal opacity-70">1–3 Hari</div>
          </div>
        </button>
        <button
          onClick={() => setActiveMode('scalping')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all',
            activeMode === 'scalping'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          <Zap className={cn('w-5 h-5', activeMode === 'scalping' ? 'text-violet-600' : 'text-slate-400')} />
          <div className="text-left">
            <div className="font-bold">Pre-Market Scalping</div>
            <div className="text-xs font-normal opacity-70">Intraday Watchlist</div>
          </div>
        </button>
      </div>

      {/* Info Banner */}
      <div className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm',
        activeMode === 'swing' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-violet-50 border border-violet-100 text-violet-800'
      )}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        {activeMode === 'swing' ? (
          <p>
            <strong>Top 10 Swing Trade:</strong> Saham dengan potensi kenaikan 1–3 hari berdasarkan momentum, posisi breakout, volume spike, dan kesehatan fundamental. Masuk posisi besok pagi dengan platform trading Anda.
          </p>
        ) : (
          <p>
            <strong>Pre-Market Scalping Watchlist:</strong> Saham paling aktif dan volatil hari ini. Gunakan sebagai watchlist sebelum pasar dibuka. Eksekusi di platform real-time Anda.
          </p>
        )}
      </div>

      {/* Summary stats */}
      {displayList.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">
              {displayList.filter(s => (activeMode === 'swing' ? s.swingScore : s.scalpingScore).totalScore >= 65).length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Sinyal Kuat (≥65)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">
              {Math.round(displayList.reduce((acc, s) => acc + (activeMode === 'swing' ? s.swingScore : s.scalpingScore).totalScore, 0) / displayList.length)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Skor Rata-rata</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {displayList.filter(s => s.percentChange >= 0).length}/{displayList.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Positif Hari Ini</div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayList.map((stock, i) => (
          <ScannerCard
            key={stock.id}
            rank={i + 1}
            stock={stock}
            mode={activeMode}
            onClick={onStockClick}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.has(stock.id)}
          />
        ))}
      </div>

      {displayList.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Data sedang dimuat. Silakan refresh.</p>
        </div>
      )}
    </div>
  );
}
