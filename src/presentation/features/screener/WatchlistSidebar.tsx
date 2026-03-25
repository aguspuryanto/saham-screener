import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Star, 
  StarOff, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  X,
  Eye,
  BarChart3
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface WatchlistSidebarProps {
  favorites: Stock[];
  onRemoveFavorite: (stockId: string) => void;
  onStockClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
}

export function WatchlistSidebar({ 
  favorites, 
  onRemoveFavorite, 
  onStockClick, 
  onToggleFavorite 
}: WatchlistSidebarProps) {
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

  if (favorites.length === 0) {
    return (
      <Card className="w-full lg:w-64 shrink-0 border-slate-200">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <StarOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Watchlist</h3>
            <p className="text-sm text-slate-500 mb-4">
              Tambahkan saham ke watchlist untuk memantau pergerakannya
            </p>
            <div className="text-xs text-slate-400">
              Klik icon ⭐ pada kartu saham untuk menambahkan
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:w-64 shrink-0 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="w-5 h-5 text-emerald-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-900">
              Daftar Pantau ({favorites.length})
            </h3>
          </div>
        </div>

        {/* Header Tabel */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs font-semibold text-slate-700 border-b border-slate-200 pb-2">
          <div className="flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" />
            Simbol
          </div>
          <div className="text-right">Last</div>
          <div className="text-right">Chg%</div>
          <div className="text-right">Volume</div>
        </div>

        {/* Daftar Saham - Format Tabel */}
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {favorites.map(stock => {
            const isPositive = stock.percentChange >= 0;
            
            return (
              <div 
                key={stock.id}
                className="grid grid-cols-4 gap-2 py-2 px-1 hover:bg-slate-50 rounded cursor-pointer transition-colors group"
                onClick={() => onStockClick(stock)}
              >
                {/* Kolom Simbol */}
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{stock.ticker}</div>
                    </div>
                  </div>
                </div>

                {/* Kolom Harga Terakhir */}
                <div className="text-right">
                  <div className="font-medium text-slate-900 text-sm">
                    {stock.lastClose.toLocaleString('id-ID', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>
                </div>

                {/* Kolom Perubahan */}
                <div className={cn("text-right font-medium text-sm", isPositive ? "text-emerald-600" : "text-red-600")}>
                  <div className="flex items-center justify-end">
                    {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(stock.percentChange).toFixed(2)}%
                  </div>
                </div>

                {/* Kolom Volume */}
                <div className="text-right">
                  <div className="text-xs text-slate-600">
                    {stock.technical.volRatio > 0 
                      ? `${(stock.technical.volRatio * 1000).toFixed(0)}K`
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
