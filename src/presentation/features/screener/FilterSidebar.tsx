import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export interface FilterOptions {
  recommendation: string[];
  strategy: string[];
  industry: string[];
  undervalued: boolean;
  oversold: boolean;
  goldenCross: boolean;
}

interface FilterSidebarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
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

  const toggleIndustry = (ind: string) => {
    const newInds = filters.industry.includes(ind)
      ? filters.industry.filter(i => i !== ind)
      : [...filters.industry, ind];
    onChange({ ...filters, industry: newInds });
  };

  const industries = [
    { id: 'FINANCE', label: 'Finance' },
    { id: 'CONSUMER GOODS INDUSTRY', label: 'Consumer Goods' },
    { id: 'TRADE, SERVICES, & INVESTMENT', label: 'Trade & Services' },
    { id: 'PROPERTY, REAL ESTATE AND BUILDING CONSTRUCTION', label: 'Property & Real Estate' },
    { id: 'INFRASTRUCTURE, UTILITIES & TRANSPORTATION', label: 'Infrastructure & Transport' },
    { id: 'BASIC INDUSTRY AND CHEMICALS', label: 'Basic Industry & Chemicals' },
    { id: 'MINING', label: 'Mining' },
    { id: 'AGRICULTURE', label: 'Agriculture' },
    { id: 'MISCELLANEOUS INDUSTRY', label: 'Miscellaneous Industry' },
    { id: 'Unknown', label: 'Unknown' }
  ];

  return (
    <Card className="w-full lg:w-64 shrink-0 border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-900">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Recommendation */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Recommendation</h4>
          <div className="space-y-2">
            {['BUY', 'ACCUMULATE', 'HOLD', 'SELL', 'REDUCE'].map(rec => (
              <label key={rec} className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filters.recommendation.includes(rec)}
                  onChange={() => toggleRec(rec)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600">{rec}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Strategy Setup</h4>
          <div className="space-y-2">
            {['Momentum', 'Reversal', 'Breakout', 'Consolidation'].map(strat => (
              <label key={strat} className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filters.strategy.includes(strat)}
                  onChange={() => toggleStrategy(strat)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600">{strat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Industry</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {industries.map(ind => (
              <label key={ind.id} className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filters.industry.includes(ind.id)}
                  onChange={() => toggleIndustry(ind.id)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600">{ind.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Quick Screens</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.undervalued}
                onChange={() => onChange({ ...filters, undervalued: !filters.undervalued })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-600">Undervalued (DCF & PBV &lt; 1)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.oversold}
                onChange={() => onChange({ ...filters, oversold: !filters.oversold })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-600">Oversold (RSI &lt; 30)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.goldenCross}
                onChange={() => onChange({ ...filters, goldenCross: !filters.goldenCross })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-600">Golden Cross (EMA20 &gt; EMA50)</span>
            </label>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => onChange({
            recommendation: [],
            strategy: [],
            industry: [],
            undervalued: false,
            oversold: false,
            goldenCross: false
          })}
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
