import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface WatchlistTickerProps {
  favorites: Stock[];
}

export function WatchlistTicker({ favorites }: WatchlistTickerProps) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white py-2 overflow-hidden border-b border-slate-800">
      <div className="relative">
        <div className="animate-ticker flex whitespace-nowrap">
          {/* Duplicate items untuk seamless loop */}
          {[...favorites, ...favorites].map((stock, index) => {
            const isPositive = stock.percentChange >= 0;
            
            return (
              <div 
                key={`${stock.id}-${index}`}
                className="inline-flex items-center px-4 border-r border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                title={`${stock.name} - Rp ${stock.lastClose.toLocaleString('id-ID')}`}
              >
                {/* Ticker */}
                <span className="font-bold text-sm mr-3 text-emerald-400">
                  {stock.ticker}
                </span>
                
                {/* Harga */}
                <span className="text-sm mr-2 text-white">
                  {stock.lastClose.toLocaleString('id-ID', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
                
                {/* Perubahan */}
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  isPositive ? "text-emerald-400" : "text-red-400"
                )}>
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* CSS untuk animation */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
