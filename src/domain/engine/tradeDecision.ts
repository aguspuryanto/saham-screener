import { IndicatorSnapshot } from '../indicators';
import { TradeDecision, TradeEngineGate, TradeGrade } from '../models/TradeEngine';

export interface LayerScores {
  trend: number;
  momentum: number;
  liquidity: number;
  smartMoney: number;
  risk: number;
  falseBreakout: number;
  riskReward: number;
  openingStrength: number;
}

export const LAYER_WEIGHTS = {
  momentum: 0.2,
  liquidity: 0.15,
  smartMoney: 0.15,
  risk: 0.2,
  falseBreakout: 0.15,
  riskReward: 0.15,
} as const;

export function computeComposite(scores: LayerScores): number {
  return Math.round(
    scores.momentum * LAYER_WEIGHTS.momentum +
      scores.liquidity * LAYER_WEIGHTS.liquidity +
      scores.smartMoney * LAYER_WEIGHTS.smartMoney +
      scores.risk * LAYER_WEIGHTS.risk +
      scores.falseBreakout * LAYER_WEIGHTS.falseBreakout +
      scores.riskReward * LAYER_WEIGHTS.riskReward
  );
}

/** Position-size multiplier by grade — mediocre setups get sized down, not just labeled. */
export const GRADE_POSITION_FACTOR: Record<TradeGrade, number> = {
  'A+': 1,
  A: 0.8,
  B: 0.5,
  C: 0.25,
  D: 0,
  NO_TRADE: 0,
};

function buildGates(snapshot: IndicatorSnapshot, scores: LayerScores, riskRewardRatio: number): TradeEngineGate[] {
  return [
    {
      label: 'Risk:Reward minimal 1:1',
      passed: riskRewardRatio >= 1,
      detail: `1:${riskRewardRatio.toFixed(1)}`,
    },
    {
      label: 'Gap tidak lebih dari 20%',
      passed: snapshot.gapPct <= 20,
      detail: `${snapshot.gapPct.toFixed(1)}%`,
    },
    {
      label: 'RSI tidak lebih dari 88',
      passed: snapshot.rsi14 <= 88,
      detail: `${snapshot.rsi14.toFixed(0)}`,
    },
    {
      label: 'Tidak ada sinyal false breakout kuat',
      passed: scores.falseBreakout >= 30,
      detail: `Skor ${scores.falseBreakout}/100`,
    },
    {
      label: 'Tidak overextended secara ekstrem',
      passed: scores.risk >= 25,
      detail: `Skor risiko ${scores.risk}/100`,
    },
    {
      label: 'Opening tidak lemah saat gap besar',
      passed: !(snapshot.gapPct > 15 && scores.openingStrength < 40),
      detail: `Gap ${snapshot.gapPct.toFixed(1)}%, opening strength ${scores.openingStrength}/100`,
    },
  ];
}

function gradeFromComposite(composite: number, riskRewardRatio: number, risk: number): TradeGrade {
  if (composite >= 80 && riskRewardRatio >= 2 && risk >= 65) return 'A+';
  if (composite >= 68) return 'A';
  if (composite >= 55) return 'B';
  if (composite >= 42) return 'C';
  return 'D';
}

function decisionFromGrade(grade: TradeGrade, riskRewardRatio: number, risk: number): TradeDecision {
  if (grade === 'A+') return riskRewardRatio >= 1.5 ? 'BUY' : 'WATCH';
  if (grade === 'A') return riskRewardRatio >= 1.5 && risk >= 55 ? 'BUY' : 'WATCH';
  if (grade === 'B' || grade === 'C') return 'WATCH';
  return 'NO_TRADE';
}

export interface DecisionResult {
  decision: TradeDecision;
  grade: TradeGrade;
  composite: number;
  gates: TradeEngineGate[];
  noTradeReasons: string[];
}

export function decideTrade(
  snapshot: IndicatorSnapshot,
  scores: LayerScores,
  riskRewardRatio: number
): DecisionResult {
  const composite = computeComposite(scores);
  const gates = buildGates(snapshot, scores, riskRewardRatio);
  const failedGates = gates.filter((g) => !g.passed);

  if (failedGates.length > 0) {
    return {
      decision: 'NO_TRADE',
      grade: 'NO_TRADE',
      composite,
      gates,
      noTradeReasons: failedGates.map((g) => `${g.label} — ${g.detail}`),
    };
  }

  const grade = gradeFromComposite(composite, riskRewardRatio, scores.risk);
  const decision = decisionFromGrade(grade, riskRewardRatio, scores.risk);
  const noTradeReasons = decision === 'NO_TRADE' ? ['Skor komposit terlalu rendah — kualitas setup di bawah standar'] : [];

  return { decision, grade, composite, gates, noTradeReasons };
}
