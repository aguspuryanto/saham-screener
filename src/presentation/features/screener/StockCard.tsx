import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ArrowDownRight, ArrowUpRight, Activity, TrendingUp, TrendingDown, Clock, BarChart2, Bell, BellRing, Star, DollarSign, Target, Users } from 'lucide-react';
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

  const getDcfColor = (status: string) => {
    switch (status) {
      case 'Undervalued': return 'success';
      case 'Overvalued': return 'danger';
      case 'Fair Value': return 'warning';
      default: return 'neutral';
    }
  };

  const getConsensusColor = (rating: string) => {
    switch (rating) {
      case 'Strong Buy':
      case 'Buy': return 'success';
      case 'Strong Sell':
      case 'Sell': return 'danger';
      case 'Hold': return 'warning';
      default: return 'neutral';
    }
  };

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
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-slate-200"
      onClick={() => onClick?.(stock)}
    >
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center text-xs text-slate-500">
            <Clock className="w-3 h-3 mr-1" />
            {stock.lastUpdated}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(stock);
              }}
              className={cn("p-1.5 rounded-full transition-colors", isFavorite ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 hover:text-slate-600")}
              title={isFavorite ? "Hapus dari Watchlist" : "Tambah ke Watchlist"}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-emerald-600' : ''}`} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSetNotification?.(stock);
              }}
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
        
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{stock.ticker}</h3>
            <p className="text-sm text-slate-500 truncate">{stock.name}</p>
            <div className="flex items-center mt-2">
              <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-slate-200 text-xs truncate max-w-[150px]">
                {stock.sector}
              </Badge>
            </div>
          </div>
          <div className="text-right ml-3 flex-shrink-0">
            <div className="text-lg font-bold text-slate-900 whitespace-nowrap">
              Rp {stock.lastClose.toLocaleString('id-ID')}
            </div>
            <div className={cn("flex items-center justify-end text-sm font-medium whitespace-nowrap", isPositive ? "text-emerald-600" : "text-red-600")}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {Math.abs(stock.percentChange).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* <div className="flex flex-wrap items-center justify-between gap-2 text-xs mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
              {getStrategyIcon(stock.strategy)}
              <span className="truncate max-w-[80px]">{stock.strategy}</span>
            </Badge>
            <Badge variant={getDcfColor(stock.dcf.status)} className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[60px]">{stock.dcf.status}</span>
            </Badge>
          </div>
          <div className="flex items-center text-slate-500 flex-shrink-0">
            <Users className="w-3 h-3 mr-1" />
            <span className="text-xs whitespace-nowrap">{stock.consensus.analystsCount} analysts</span>
          </div>
        </div> */}
      </CardHeader>
      
      <CardContent className="px-5 pb-5">
        {/* Broker Consensus */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Broker Consensus</span>
            <Badge variant={getConsensusColor(stock.consensus.rating)} className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              {stock.consensus.rating}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Avg Rating: {stock.consensus.averageRating.toFixed(1)}/5</span>
            <span className="text-slate-600">{stock.consensus.analystsCount} analysts</span>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="mb-4">
          <h4 className="text-xs text-slate-500 font-medium mb-2">Technical Indicators</h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="text-slate-500 mb-1">RSI(14)</div>
              <div className={cn("font-semibold", 
                stock.technical.rsi14 < 30 ? "text-emerald-600" : 
                stock.technical.rsi14 > 70 ? "text-red-600" : "text-slate-700"
              )}>
                {stock.technical.rsi14}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="text-slate-500 mb-1">MACD</div>
              <div className={cn("font-semibold", 
                stock.technical.macd > stock.technical.macdSignal ? "text-emerald-600" : "text-red-600"
              )}>
                {stock.technical.macd > stock.technical.macdSignal ? 'Bullish' : 'Bearish'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="text-slate-500 mb-1">Vol Ratio</div>
              <div className={cn("font-semibold", 
                stock.technical.volRatio > 1.5 ? "text-emerald-600" : 
                stock.technical.volRatio < 0.5 ? "text-red-600" : "text-slate-700"
              )}>
                {stock.technical.volRatio}x
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-center text-xs">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="text-slate-500 mb-1">EMA20 vs EMA50</div>
              <div className={cn("font-semibold", 
                stock.technical.ema20 > stock.technical.ema50 ? "text-emerald-600" : "text-red-600"
              )}>
                {stock.technical.ema20 > stock.technical.ema50 ? 'Golden Cross' : 'Death Cross'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <div className="text-slate-500 mb-1">RSI(12)</div>
              <div className={cn("font-semibold", 
                stock.technical.rsi12 < 40 ? "text-emerald-600" : 
                stock.technical.rsi12 > 60 ? "text-red-600" : "text-slate-700"
              )}>
                {stock.technical.rsi12}
              </div>
            </div>
          </div>
        </div>

        {/* DCF Valuation */}
        <div className="mb-4">
          <h4 className="text-xs text-slate-500 font-medium mb-2">DCF Valuation</h4>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600">Intrinsic Value</span>
              <span className="font-semibold text-slate-900">
                Rp {stock.dcf.intrinsicValue.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Potential</span>
              <span className={cn("font-semibold", 
                stock.dcf.status === 'Undervalued' ? "text-emerald-600" : 
                stock.dcf.status === 'Overvalued' ? "text-red-600" : "text-slate-700"
              )}>
                {stock.dcf.status === 'Undervalued' ? '+' : stock.dcf.status === 'Overvalued' ? '-' : ''}
                {Math.abs(((stock.dcf.intrinsicValue - stock.lastClose) / stock.lastClose * 100)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Fundamental Metrics */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 flex-1">
            <div>
              <span className="text-slate-500">PBV:</span> 
              <span className={cn("font-medium ml-1", 
                stock.fundamental.pbv < 1 ? "text-emerald-600" : "text-slate-700"
              )}>
                {stock.fundamental.pbv}x
              </span>
            </div>
            <div>
              <span className="text-slate-500">PER:</span> 
              <span className="font-medium ml-1">{stock.fundamental.per}x</span>
            </div>
            <div>
              <span className="text-slate-500">EPS:</span> 
              <span className="font-medium ml-1">{stock.fundamental.eps}</span>
            </div>
            <div>
              <span className="text-slate-500">DY:</span> 
              <span className={cn("font-medium ml-1", 
                stock.fundamental.dy > 3 ? "text-emerald-600" : "text-slate-700"
              )}>
                {stock.fundamental.dy}%
              </span>
            </div>
            <div>
              <span className="text-slate-500">ROE:</span> 
              <span className={cn("font-medium ml-1", 
                stock.fundamental.roe > 15 ? "text-emerald-600" : "text-slate-700"
              )}>
                {stock.fundamental.roe}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
