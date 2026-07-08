import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { ArrowDown, ArrowUp, Star } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { formatCompactNumber as formatCompact } from '../../../utils/format';

type SortField = 'ticker' | 'name' | 'price' | 'percentChange' | 'swingScore' | 'scalpingScore';
type SortDirection = 'asc' | 'desc';

interface StockListViewProps {
  stocks: Stock[];
  onClick?: (stock: Stock) => void;
  onToggleFavorite?: (stock: Stock) => void;
  favorites: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

function SortableHeader({
  label, field, sortField, sortDirection, onSortChange, align = 'right',
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  align?: 'left' | 'right';
}) {
  const isActive = sortField === field;
  return (
    <th
      onClick={() => onSortChange(field)}
      className={cn(
        'px-3 py-3 text-xs font-normal text-slate-400 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {label}
        {isActive && (sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </span>
    </th>
  );
}

export function StockListView({ stocks, onClick, onToggleFavorite, favorites, sortField, sortDirection, onSortChange }: StockListViewProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-20 bg-white px-3 py-3 text-left text-xs font-normal text-slate-400 whitespace-nowrap border-r border-slate-200">Saham</th>
              <SortableHeader label="Perubahan %" field="percentChange" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} />
              <SortableHeader label="Harga" field="price" sortField={sortField} sortDirection={sortDirection} onSortChange={onSortChange} />
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">Vol</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">Volume relatif</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">Kap pasar</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">P/E</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">EPS terdilusi TTM</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">Pertumbuhan EPS TTM YoY</th>
              <th className="px-3 py-3 text-right text-xs font-normal text-slate-400 whitespace-nowrap">Imbal hasil TTM</th>
              <th className="px-3 py-3 text-left text-xs font-normal text-slate-400 whitespace-nowrap">Sektor</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              const isPositive = stock.percentChange >= 0;
              const isFavorite = favorites.has(stock.id);
              return (
                <tr
                  key={stock.id}
                  onClick={() => onClick?.(stock)}
                  className="group border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-3 border-r border-slate-200">
                    <div className="flex items-center gap-2 min-w-[220px]">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(stock); }}
                        className={cn('p-1 rounded-full transition-colors flex-shrink-0', isFavorite ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500')}
                        title={isFavorite ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
                      >
                        <Star className={cn('w-3.5 h-3.5', isFavorite && 'fill-emerald-600')} />
                      </button>
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                        {stock.ticker}
                      </span>
                      <span className="text-sm text-slate-700 truncate max-w-[200px]" title={stock.name}>
                        {stock.name}
                      </span>
                    </div>
                  </td>
                  <td className={cn('px-3 py-3 text-right text-sm font-semibold whitespace-nowrap', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                    {isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.lastClose.toLocaleString('id-ID')} <span className="text-xs text-slate-400">IDR</span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">{formatCompact(stock.volume)}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.technical.volRatio > 0 ? stock.technical.volRatio.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.capitalization > 0 ? <>{formatCompact(stock.capitalization)} <span className="text-xs text-slate-400">IDR</span></> : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.fundamental.per > 0 ? stock.fundamental.per.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.fundamental.eps !== 0 ? <>{stock.fundamental.eps.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs text-slate-400">IDR</span></> : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-400 whitespace-nowrap">-</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-700 whitespace-nowrap">
                    {stock.fundamental.dy > 0 ? `${stock.fundamental.dy.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700 max-w-[160px] truncate" title={stock.newSectorName || stock.subSector || stock.sector}>
                    {stock.newSectorName || stock.subSector || stock.sector || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
