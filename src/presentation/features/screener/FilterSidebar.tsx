import React from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronDown } from 'lucide-react';

const INDUSTRIES = [
  { id: 'FINANCE', label: 'Keuangan' },
  { id: 'MINING', label: 'Tambang' },
  { id: 'CONSUMER GOODS INDUSTRY', label: 'Konsumer' },
  { id: 'TRADE, SERVICES, & INVESTMENT', label: 'Jasa & Investasi' },
  { id: 'PROPERTY, REAL ESTATE AND BUILDING CONSTRUCTION', label: 'Properti' },
  { id: 'INFRASTRUCTURE, UTILITIES & TRANSPORTATION', label: 'Infrastruktur' },
  { id: 'BASIC INDUSTRY AND CHEMICALS', label: 'Industri Dasar' },
  { id: 'AGRICULTURE', label: 'Agrikultur' },
  { id: 'MISCELLANEOUS INDUSTRY', label: 'Lainnya' },
];

export interface FilterOptions {
  recommendation: string[];
  strategy: string[];
  industry: string[];
  search: string;
  undervalued: boolean;
  oversold: boolean;
  goldenCross: boolean;
  minSwingScore: number;
  minScalpingScore: number;
  minPrice: number;
  maxPrice: number;
  volumeSpike: boolean;
  blueChip: boolean;
  lowRisk: boolean;
}

interface FilterSidebarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  stocks?: Stock[];
}

export const DEFAULT_FILTERS: FilterOptions = {
  recommendation: [],
  strategy: [],
  industry: [],
  search: '',
  undervalued: false,
  oversold: false,
  goldenCross: false,
  minSwingScore: 0,
  minScalpingScore: 0,
  minPrice: 0,
  maxPrice: 0,
  volumeSpike: false,
  blueChip: false,
  lowRisk: false,
};

export function FilterSidebar({ filters, onChange, stocks = [] }: FilterSidebarProps) {
  const toggleRec = (rec: string) => {
    const newRecs = filters.recommendation.includes(rec)
      ? filters.recommendation.filter(r => r !== rec)
      : [...filters.recommendation, rec];
    onChange({ ...filters, recommendation: newRecs });
  };

  const toggleStrategy = (strat: string) => {
    const newStrats = filters.strategy.includes(strat)
      ? filters.strategy.filter(s => s !== strat)
      : [...filters.strategy, strat];
    onChange({ ...filters, strategy: newStrats });
  };

  const toggleIndustry = (industryId: string) => {
    const newIndustries = filters.industry.includes(industryId)
      ? filters.industry.filter(id => id !== industryId)
      : [...filters.industry, industryId];
    onChange({ ...filters, industry: newIndustries });
  };

  return (
    <Card className="w-full lg:w-64 shrink-0 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
      <details className="group">
        <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="text-base font-bold text-slate-900 dark:text-slate-50">Filter Lanjutan</span>
          <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <CardContent className="space-y-5 pt-0">

        {/* S.C.A.N. Score Filters */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">S.C.A.N. Score Minimum</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <label>Swing Score ≥</label>
                <span className="font-semibold text-emerald-600">{filters.minSwingScore}</span>
              </div>
              <input
                type="range" min={0} max={90} step={5}
                value={filters.minSwingScore}
                onChange={(e) => onChange({ ...filters, minSwingScore: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span>0</span><span>45</span><span>90</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <label>Scalping Score ≥</label>
                <span className="font-semibold text-violet-600">{filters.minScalpingScore}</span>
              </div>
              <input
                type="range" min={0} max={90} step={5}
                value={filters.minScalpingScore}
                onChange={(e) => onChange({ ...filters, minScalpingScore: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                <span>0</span><span>45</span><span>90</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rentang Harga (Rp)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Min</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Max</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxPrice || ''}
                onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Screens */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Screens</h4>
          <div className="space-y-2">
            {[
              { key: 'undervalued', label: 'Undervalued (PBV < 1)' },
              { key: 'oversold', label: 'Oversold (RSI < 30)' },
              { key: 'goldenCross', label: 'Golden Cross (EMA20 > EMA50)' },
              { key: 'volumeSpike', label: 'Volume Spike Aktif' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters as any)[key]}
                  onChange={() => onChange({ ...filters, [key]: !(filters as any)[key] })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rekomendasi</h4>
          <div className="space-y-1.5">
            {['BUY', 'ACCUMULATE', 'HOLD', 'SELL', 'REDUCE'].map(rec => (
              <label key={rec} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.recommendation.includes(rec)}
                  onChange={() => toggleRec(rec)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">{rec}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Strategi</h4>
          <div className="space-y-1.5">
            {['Momentum', 'Reversal', 'Breakout', 'Consolidation'].map(strat => (
              <label key={strat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.strategy.includes(strat)}
                  onChange={() => toggleStrategy(strat)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">{strat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sektor</h4>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map(industry => {
              const count = stocks.filter(s => s.sector === industry.id).length;
              const isSelected = filters.industry.includes(industry.id);
              return (
                <button
                  key={industry.id}
                  onClick={() => toggleIndustry(industry.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                >
                  {industry.label}
                  <span className={`inline-flex items-center justify-center w-4 h-4 text-xs rounded-full ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          Reset Semua Filter
        </Button>
        </CardContent>
      </details>
    </Card>
  );
}
