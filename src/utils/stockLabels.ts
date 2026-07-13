import { Stock } from '../domain/models/Stock';

export type SentimentVariant = 'success' | 'neutral' | 'danger';

export interface RecommendationDisplay {
  stars: number;
  label: string;
  variant: SentimentVariant;
}

const RECOMMENDATION_MAP: Record<Stock['recommendation'], RecommendationDisplay> = {
  BUY: { stars: 5, label: 'Sangat Direkomendasikan', variant: 'success' },
  ACCUMULATE: { stars: 4, label: 'Layak Dipertimbangkan', variant: 'success' },
  HOLD: { stars: 3, label: 'Pantau', variant: 'neutral' },
  NEUTRAL: { stars: 3, label: 'Pantau', variant: 'neutral' },
  SELL: { stars: 2, label: 'Hindari', variant: 'danger' },
  REDUCE: { stars: 1, label: 'Risiko Tinggi', variant: 'danger' },
};

export function getRecommendationDisplay(stock: Stock): RecommendationDisplay {
  return RECOMMENDATION_MAP[stock.recommendation] ?? RECOMMENDATION_MAP.NEUTRAL;
}

export function getStarString(stars: number): string {
  return '★★★★★'.slice(0, stars) + '☆☆☆☆☆'.slice(0, 5 - stars);
}

const STRATEGY_FALLBACK: Record<Stock['strategy'], string> = {
  Momentum: 'Sedang berada dalam tren naik yang kuat.',
  Reversal: 'Berpotensi berbalik arah setelah tren sebelumnya.',
  Breakout: 'Baru menembus level harga penting dengan volume pendukung.',
  Consolidation: 'Harga bergerak stabil, menunggu arah selanjutnya.',
};

export function getWhySummary(stock: Stock): string {
  const topSignal = stock.swingScore.signals[0] || stock.scalpingScore.signals[0];
  if (topSignal) {
    // Sinyal sudah dalam Bahasa Indonesia siap pakai (mis. "🏷️ PE Murah (12.3x)") — cukup bersihkan emoji leading.
    return topSignal.replace(/^\p{Extended_Pictographic}️?\s*/u, '');
  }
  return STRATEGY_FALLBACK[stock.strategy] ?? 'Data sinyal belum tersedia untuk saham ini.';
}

/**
 * Beta & stdev tidak punya skala baku di sumber data ini, jadi dinormalisasi dengan
 * batas praktis pasar IDX (beta 0.5-2.5, stdev harian 0-6%) lalu dibalik jadi "skor aman".
 */
export function deriveRiskScore(beta: number, stdev: number): number {
  const normalizedBeta = clamp((beta - 0.5) / 2, 0, 1);
  const normalizedStdev = clamp(stdev / 0.06, 0, 1);
  const riskRaw = (normalizedBeta + normalizedStdev) / 2;
  return Math.round((1 - riskRaw) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface HeatScores {
  momentum: number;
  likuiditas: number;
  fundamental: number;
  risiko: number;
}

export function getHeatScores(stock: Stock): HeatScores {
  return {
    momentum: clamp(stock.swingScore.momentumScore, 0, 100),
    likuiditas: clamp(stock.swingScore.volumeScore, 0, 100),
    fundamental: clamp(stock.swingScore.fundamentalScore, 0, 100),
    risiko: deriveRiskScore(stock.beta, stock.stdev),
  };
}

export function getValuationLabel(stock: Stock): 'Murah' | 'Wajar' | 'Mahal' {
  if (stock.dcf.status === 'Undervalued') return 'Murah';
  if (stock.dcf.status === 'Overvalued') return 'Mahal';
  return 'Wajar';
}

export function isBlueChip(stock: Stock): boolean {
  return stock.capitalization >= 10_000_000_000_000; // ≥ Rp10 triliun
}

export function isLowRisk(stock: Stock): boolean {
  return stock.beta > 0 && stock.beta < 1;
}
