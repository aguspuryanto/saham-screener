import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ArrowDownRight, ArrowUpRight, Activity, TrendingUp, TrendingDown, Clock, BarChart2, Bell, BellRing } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface StockCardProps {
  key?: React.Key;
  stock: Stock;
  onClick?: (stock: Stock) => void;
  onSetNotification?: (stock: Stock) => void;
  hasNotification?: boolean;
}

export function StockCard({ stock, onClick, onSetNotification, hasNotification }: StockCardProps) {
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
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center text-xs text-slate-500">
            <Clock className="w-3 h-3 mr-1" />
            {stock.lastUpdated}
          </div>
          <div className="flex items-center space-x-2">
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
            <Badge variant={getRecColor(stock.recommendation)}>
              {stock.recommendation}
            </Badge>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{stock.ticker}</h3>
            <p className="text-sm text-slate-500 truncate max-w-[150px]">{stock.name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">
              Rp {stock.lastClose.toLocaleString('id-ID')}
            </div>
            <div className={cn("flex items-center justify-end text-sm font-medium", isPositive ? "text-emerald-600" : "text-red-600")}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {Math.abs(stock.percentChange)}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5">
        <div className="flex items-center mb-4">
          <Badge variant="neutral" className="bg-slate-100 text-slate-600 border-slate-200">
            {getStrategyIcon(stock.strategy)}
            {stock.strategy}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
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

        <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
          <div className="flex space-x-3">
            <div>
              <span className="text-slate-500">PBV:</span> <span className="font-medium">{stock.fundamental.pbv}x</span>
            </div>
            <div>
              <span className="text-slate-500">PER:</span> <span className="font-medium">{stock.fundamental.per}x</span>
            </div>
            <div>
              <span className="text-slate-500">EPS:</span> <span className="font-medium">{stock.fundamental.eps}</span>
            </div>
            <div>
              <span className="text-slate-500">DY:</span> <span className="font-medium">{stock.fundamental.dy}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
