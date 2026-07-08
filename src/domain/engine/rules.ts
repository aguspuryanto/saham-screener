import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { IndicatorSnapshot } from '../indicators';
import { PatternMatch } from '../patterns/candlestick';
import { AiScores, SwingProbability, ScalpingProbability } from '../models/AiEngine';

export interface RuleContext {
  snapshot: IndicatorSnapshot;
  patterns: PatternMatch[];
  bars: OHLCVBar[];
  stock: Stock;
  scores: AiScores;
}

export interface RuleEffect {
  scoreDeltas?: Partial<Record<keyof AiScores, number>>;
  swingProbDeltas?: Partial<Pick<SwingProbability, 'take_profit' | 'stop_loss'>>;
  scalpProbDeltas?: Partial<ScalpingProbability>;
  explanation: string;
}

export interface Rule {
  id: string;
  category: 'momentum' | 'trend' | 'distribution' | 'volatility' | 'smart_money' | 'risk' | 'liquidity';
  evaluate: (ctx: RuleContext) => RuleEffect | null;
}

function hasPattern(patterns: PatternMatch[], id: string): boolean {
  return patterns.some((p) => p.id === id);
}

export const RULES: Rule[] = [
  {
    id: 'bullish_momentum_combo',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (
        snapshot.lastClose > snapshot.ema20 &&
        snapshot.ema9 > snapshot.ema20 &&
        snapshot.rsi14 >= 55 &&
        snapshot.rsi14 <= 70 &&
        snapshot.relativeVolume > 2 &&
        snapshot.atr14 > snapshot.prevAtr14 &&
        snapshot.higherHigh
      ) {
        return {
          scoreDeltas: { momentum: 15, trend: 10 },
          swingProbDeltas: { take_profit: 12 },
          scalpProbDeltas: { momentum_continuation: 8 },
          explanation:
            'Momentum bullish kuat: harga di atas EMA20, EMA9 > EMA20, RSI sehat (55-70), volume > 2x rata-rata, ATR meningkat, dan terbentuk Higher High.',
        };
      }
      return null;
    },
  },
  {
    id: 'bearish_distribution_combo',
    category: 'distribution',
    evaluate: ({ snapshot }) => {
      const range = snapshot.lastHigh - snapshot.lastLow;
      const closeNearLow = range > 0 ? (snapshot.lastClose - snapshot.lastLow) / range < 0.3 : false;

      if (snapshot.upperShadowPct > 40 && snapshot.relativeVolume > 2 && closeNearLow) {
        return {
          scoreDeltas: { distribution: 20 },
          swingProbDeltas: { stop_loss: 15 },
          scalpProbDeltas: { false_breakout: 25 },
          explanation:
            'Sinyal distribusi: upper shadow panjang, volume besar, dan close dekat low — indikasi potensi false breakout.',
        };
      }
      return null;
    },
  },
  {
    id: 'oversold_reversal',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (snapshot.rsi14 < 30 && snapshot.stochasticK < 20) {
        return {
          scoreDeltas: { momentum: 8 },
          swingProbDeltas: { take_profit: 6 },
          explanation: 'RSI oversold (<30) dan Stochastic oversold — potensi reversal teknikal.',
        };
      }
      return null;
    },
  },
  {
    id: 'overbought_warning',
    category: 'risk',
    evaluate: ({ snapshot }) => {
      if (snapshot.rsi14 > 75) {
        return {
          scoreDeltas: { momentum: -5 },
          swingProbDeltas: { stop_loss: 10 },
          explanation: 'RSI overbought (>75) — risiko koreksi jangka pendek meningkat.',
        };
      }
      return null;
    },
  },
  {
    id: 'macd_golden_cross',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (snapshot.prevMacd <= snapshot.prevMacdSignal && snapshot.macd > snapshot.macdSignal) {
        return {
          scoreDeltas: { momentum: 12, trend: 5 },
          swingProbDeltas: { take_profit: 8 },
          explanation: 'MACD Golden Cross baru terjadi — momentum bullish menguat.',
        };
      }
      return null;
    },
  },
  {
    id: 'macd_death_cross',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (snapshot.prevMacd >= snapshot.prevMacdSignal && snapshot.macd < snapshot.macdSignal) {
        return {
          scoreDeltas: { momentum: -12, trend: -5 },
          swingProbDeltas: { stop_loss: 8 },
          explanation: 'MACD Death Cross baru terjadi — momentum bearish menguat.',
        };
      }
      return null;
    },
  },
  {
    id: 'volume_dry_up',
    category: 'liquidity',
    evaluate: ({ snapshot }) => {
      if (snapshot.relativeVolume < 0.5) {
        return {
          scoreDeltas: { liquidity: -15 },
          scalpProbDeltas: { opening_strength: -10 },
          explanation: 'Volume mengering (<0.5x rata-rata) — likuiditas rendah, risiko sulit keluar posisi.',
        };
      }
      return null;
    },
  },
  {
    id: 'adx_strong_uptrend',
    category: 'trend',
    evaluate: ({ snapshot }) => {
      if (snapshot.adx14 >= 25 && snapshot.ema20 > snapshot.ema50) {
        return {
          scoreDeltas: { trend: 10 },
          explanation: 'ADX >= 25 mengonfirmasi kekuatan tren naik.',
        };
      }
      return null;
    },
  },
  {
    id: 'bollinger_breakout_up',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (snapshot.lastClose > snapshot.bollingerUpper && snapshot.relativeVolume > 1.5) {
        return {
          scoreDeltas: { momentum: 10 },
          swingProbDeltas: { take_profit: 8 },
          scalpProbDeltas: { gap_up: 8 },
          explanation: 'Breakout di atas Bollinger Band atas disertai volume tinggi.',
        };
      }
      return null;
    },
  },
  {
    id: 'bollinger_breakdown',
    category: 'distribution',
    evaluate: ({ snapshot }) => {
      if (snapshot.lastClose < snapshot.bollingerLower) {
        return {
          scoreDeltas: { distribution: 10 },
          swingProbDeltas: { stop_loss: 8 },
          explanation: 'Harga menembus Bollinger Band bawah — tekanan jual meningkat.',
        };
      }
      return null;
    },
  },
  {
    id: 'gap_up_continuation',
    category: 'momentum',
    evaluate: ({ snapshot }) => {
      if (snapshot.gapPct > 1 && snapshot.lastClose > snapshot.lastOpen) {
        return {
          scalpProbDeltas: { gap_up: 15, momentum_continuation: 10 },
          explanation: 'Gap up > 1% dan ditutup menguat — indikasi kelanjutan momentum.',
        };
      }
      return null;
    },
  },
  {
    id: 'hammer_reversal',
    category: 'smart_money',
    evaluate: ({ snapshot, patterns }) => {
      if (hasPattern(patterns, 'hammer') && snapshot.rsi14 < 40) {
        return {
          scoreDeltas: { momentum: 8, smart_money: 8 },
          swingProbDeltas: { take_profit: 6 },
          explanation: 'Pola Hammer terbentuk saat RSI rendah — sinyal potensi reversal bullish.',
        };
      }
      return null;
    },
  },
  {
    id: 'bullish_engulfing_signal',
    category: 'momentum',
    evaluate: ({ patterns }) => {
      if (hasPattern(patterns, 'bullish_engulfing')) {
        return {
          scoreDeltas: { momentum: 10, smart_money: 5 },
          swingProbDeltas: { take_profit: 8 },
          explanation: 'Pola Bullish Engulfing terbentuk — sinyal pembalikan naik.',
        };
      }
      return null;
    },
  },
  {
    id: 'bearish_engulfing_signal',
    category: 'distribution',
    evaluate: ({ patterns }) => {
      if (hasPattern(patterns, 'bearish_engulfing')) {
        return {
          scoreDeltas: { distribution: 15 },
          swingProbDeltas: { stop_loss: 10 },
          explanation: 'Pola Bearish Engulfing terbentuk — sinyal pembalikan turun.',
        };
      }
      return null;
    },
  },
];

export interface AppliedRulesResult {
  scoreDeltas: Partial<Record<keyof AiScores, number>>;
  swingProbDeltas: Partial<Pick<SwingProbability, 'take_profit' | 'stop_loss'>>;
  scalpProbDeltas: Partial<ScalpingProbability>;
  firedRuleIds: string[];
  explanations: string[];
}

export function applyRules(ctx: RuleContext, weights: Record<string, number> = {}): AppliedRulesResult {
  const scoreDeltas: Partial<Record<keyof AiScores, number>> = {};
  const swingProbDeltas: Partial<Pick<SwingProbability, 'take_profit' | 'stop_loss'>> = {};
  const scalpProbDeltas: Partial<ScalpingProbability> = {};
  const firedRuleIds: string[] = [];
  const explanations: string[] = [];

  for (const rule of RULES) {
    const effect = rule.evaluate(ctx);
    if (!effect) continue;

    const weight = weights[rule.id] ?? 1.0;
    firedRuleIds.push(rule.id);
    explanations.push(effect.explanation);

    if (effect.scoreDeltas) {
      for (const [key, delta] of Object.entries(effect.scoreDeltas)) {
        const k = key as keyof AiScores;
        scoreDeltas[k] = (scoreDeltas[k] ?? 0) + (delta ?? 0) * weight;
      }
    }
    if (effect.swingProbDeltas) {
      for (const [key, delta] of Object.entries(effect.swingProbDeltas)) {
        const k = key as keyof typeof swingProbDeltas;
        swingProbDeltas[k] = (swingProbDeltas[k] ?? 0) + (delta ?? 0) * weight;
      }
    }
    if (effect.scalpProbDeltas) {
      for (const [key, delta] of Object.entries(effect.scalpProbDeltas)) {
        const k = key as keyof ScalpingProbability;
        scalpProbDeltas[k] = (scalpProbDeltas[k] ?? 0) + (delta ?? 0) * weight;
      }
    }
  }

  return { scoreDeltas, swingProbDeltas, scalpProbDeltas, firedRuleIds, explanations };
}
