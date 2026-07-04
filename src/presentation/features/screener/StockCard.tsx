import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowDownRight, ArrowUpRight, Activity, TrendingUp, TrendingDown,
  Clock, BarChart2, Bell, BellRing, Star, DollarSign, Target, Zap
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface StockCardProps {
  key?: React.Key;
  stock: Stock;
  onClick?: (stock: Stock) => void;
  onSetNotification?: (stock: Stock) => void;
  hasNotification?: boolean;
  onToggleFavorite?: (stock: Stock) => void;
  isFavorite?: boolean;
}

function MiniScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-bold text-slate-700">{score}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%`, transition: 'width 0.8s ease' }}
        />
      </div>
    </div>
  );
}

function PeriodBadge({ label, value }: { label: string; value: number }) {
  const isPos = value >= 0;
  return (
    <div className="text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={cn('text-xs font-semibold', isPos ? 'text-emerald-600' : 'text-red-500')}>
        {isPos ? '+' : ''}{value.toFixed(1)}%
      </div>
    </div>
  );
}

export function StockCard({ stock, onClick, onSetNotification, hasNotification, onToggleFavorite, isFavorite }: StockCardProps) {
  const isPositive = stock.percentChange >= 0;

  const getRecColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
      case 'ACCUMULATE':
        return 'success';
      case 'SELL':
      case 'REDUCE':
        return 'danger';
      case 'HOLD':
      case 'NEUTRAL':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const swingScoreColor =
    stock.swingScore.totalScore >= 70 ? 'text-emerald-700 bg-emerald-50' :
    stock.swingScore.totalScore >= 50 ? 'text-blue-700 bg-blue-50' :
    stock.swingScore.totalScore >= 30 ? 'text-amber-700 bg-amber-50' :
    'text-slate-600 bg-slate-100';

  const scalpingScoreColor =
    stock.scalpingScore.totalScore >= 70 ? 'text-violet-700 bg-violet-50' :
    stock.scalpingScore.totalScore >= 50 ? 'text-indigo-700 bg-indigo-50' :
    'text-slate-600 bg-slate-100';

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'Momentum': return <TrendingUp className="w-3 h-3 mr-1" />;
      case 'Reversal': return <Activity className="w-3 h-3 mr-1" />;
      case 'Breakout': return <ArrowUpRight className="w-3 h-3 mr-1" />;
      case 'Consolidation': return <BarChart2 className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden"
      onClick={() => onClick?.(stock)}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        {/* Top row: date + actions */}
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center text-xs text-slate-400">
            <Clock className="w-3 h-3 mr-1" />
            {stock.lastUpdated}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(stock); }}
              className={cn("p-1.5 rounded-full transition-colors", isFavorite ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 hover:text-slate-600")}
              title={isFavorite ? "Hapus dari Watchlist" : "Tambah ke Watchlist"}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-emerald-600' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSetNotification?.(stock); }}
              className={cn("p-1.5 rounded-full transition-colors", hasNotification ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 hover:text-slate-600")}
              title="Set Price Alert"
            >
              {hasNotification ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </button>
            <Badge variant={getRecColor(stock.recommendation)} className="text-xs font-semibold">
              {stock.recommendation}
            </Badge>
          </div>
        </div>

        {/* Ticker + Price */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 mb-0.5">{stock.ticker}</h3>
            <p className="text-xs text-slate-500 truncate">{stock.name}</p>
            <span className="inline-block mt-1.5 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md truncate max-w-[150px]">
              {stock.subSector || stock.sector}
            </span>
          </div>
          <div className="text-right ml-3 flex-shrink-0">
            <div className="text-xl font-bold text-slate-900">
              {stock.lastClose.toLocaleString('id-ID')}
            </div>
            <div className={cn("flex items-center justify-end text-sm font-semibold", isPositive ? "text-emerald-600" : "text-red-500")}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(stock.percentChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* S.C.A.N. Scores */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            S.C.A.N. Skor
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className={cn("rounded-lg px-2.5 py-2 text-center", swingScoreColor)}>
              <div className="text-xs font-medium opacity-75 mb-0.5">Swing</div>
              <div className="text-lg font-bold">{stock.swingScore.totalScore}</div>
            </div>
            <div className={cn("rounded-lg px-2.5 py-2 text-center", scalpingScoreColor)}>
              <div className="text-xs font-medium opacity-75 mb-0.5">Scalping</div>
              <div className="text-lg font-bold flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {stock.scalpingScore.totalScore}
              </div>
            </div>
          </div>

          {/* Top signal if any */}
          {stock.swingScore.signals.length > 0 && (
            <div className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg">
              {stock.swingScore.signals[0]}
            </div>
          )}
        </div>

        {/* Multi-period returns */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 py-2 border-y border-slate-100">
          <PeriodBadge label="1H" value={stock.oneDay} />
          <PeriodBadge label="1M" value={stock.oneWeek} />
          <PeriodBadge label="1B" value={stock.oneMonth} />
          <PeriodBadge label="3B" value={stock.threeMonth} />
        </div>

        {/* Technical quick view */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3">
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <div className="text-slate-400 mb-0.5">RSI(14)</div>
            <div className={cn("font-semibold",
              stock.technical.rsi14 < 30 ? "text-emerald-600" :
              stock.technical.rsi14 > 70 ? "text-red-600" : "text-slate-700"
            )}>
              {stock.technical.rsi14}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <div className="text-slate-400 mb-0.5">MACD</div>
            <div className={cn("font-semibold text-xs",
              stock.technical.macd > stock.technical.macdSignal ? "text-emerald-600" : "text-red-600"
            )}>
              {stock.technical.macd > stock.technical.macdSignal ? 'Bullish' : 'Bearish'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
            <div className="text-slate-400 mb-0.5">EMA</div>
            <div className={cn("font-semibold text-xs",
              stock.technical.ema20 > stock.technical.ema50 ? "text-emerald-600" : "text-red-600"
            )}>
              {stock.technical.ema20 > stock.technical.ema50 ? '✓ Golden' : '✗ Death'}
            </div>
          </div>
        </div>

        {/* Fundamental quick view */}
        <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-2.5">
          <div className="flex flex-col items-center">
            <span className="text-slate-400">PBV</span>
            <span className={cn("font-semibold", stock.fundamental.pbv > 0 && stock.fundamental.pbv < 1 ? "text-emerald-600" : "text-slate-700")}>
              {stock.fundamental.pbv > 0 ? `${stock.fundamental.pbv}x` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-400">PER</span>
            <span className={cn("font-semibold", stock.fundamental.per > 0 && stock.fundamental.per < 15 ? "text-emerald-600" : "text-slate-700")}>
              {stock.fundamental.per > 0 ? `${stock.fundamental.per}x` : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-400">ROE</span>
            <span className={cn("font-semibold", stock.fundamental.roe > 15 ? "text-emerald-600" : "text-slate-700")}>
              {stock.fundamental.roe}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
