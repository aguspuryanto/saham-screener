import { useMemo } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { Card } from '../../components/ui/Card';

interface HeroSummaryProps {
  stocks: Stock[];
}

interface Stat {
  value: string;
  label: string;
  accent?: 'positive' | 'negative' | 'neutral';
}

function computeStats(stocks: Stock[]): Stat[] {
  if (stocks.length === 0) {
    return [
      { value: '-', label: 'Saham Menarik' },
      { value: '-', label: 'Rata-rata AI Score' },
      { value: '-', label: 'Momentum Pasar' },
      { value: '-', label: 'Volume Pasar' },
      { value: '-', label: 'Sentimen' },
    ];
  }

  const recommendedCount = stocks.filter(s => s.recommendation === 'BUY' || s.recommendation === 'ACCUMULATE').length;
  const avgScore = Math.round(stocks.reduce((sum, s) => sum + s.swingScore.totalScore, 0) / stocks.length);
  const positiveRatio = stocks.filter(s => s.percentChange >= 0).length / stocks.length;
  const avgVolumeScore = stocks.reduce((sum, s) => sum + s.swingScore.volumeScore, 0) / stocks.length;

  const momentum = positiveRatio >= 0.55 ? 'Bullish' : positiveRatio <= 0.45 ? 'Bearish' : 'Netral';
  const volumeLevel = avgVolumeScore >= 60 ? 'Tinggi' : avgVolumeScore >= 35 ? 'Sedang' : 'Rendah';
  const sentiment = positiveRatio >= 0.55 ? 'Positif' : positiveRatio <= 0.45 ? 'Negatif' : 'Netral';

  return [
    { value: `🔥 ${recommendedCount}`, label: 'Saham Menarik', accent: 'positive' },
    { value: `${avgScore}`, label: 'Rata-rata AI Score', accent: 'neutral' },
    { value: momentum, label: 'Momentum Pasar', accent: momentum === 'Bullish' ? 'positive' : momentum === 'Bearish' ? 'negative' : 'neutral' },
    { value: volumeLevel, label: 'Volume Pasar', accent: 'neutral' },
    { value: sentiment, label: 'Sentimen', accent: sentiment === 'Positif' ? 'positive' : sentiment === 'Negatif' ? 'negative' : 'neutral' },
  ];
}

const ACCENT_CLASS: Record<string, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-500 dark:text-red-400',
  neutral: 'text-slate-900 dark:text-slate-50',
};

export function HeroSummary({ stocks }: HeroSummaryProps) {
  const stats = useMemo(() => computeStats(stocks), [stocks]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 p-4 text-center">
          <div className={`text-2xl font-bold tabular-nums ${ACCENT_CLASS[stat.accent ?? 'neutral']}`}>{stat.value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}
