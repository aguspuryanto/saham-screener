import { useMemo } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { computeAiEngineOutput } from '../../../domain/engine/aiEngine';
import { computeTradeEngineOutput } from '../../../domain/engine/tradeEngine';
import { AiScores } from '../../../domain/models/AiEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader2, Sparkles } from 'lucide-react';
import { useStockHistory } from './useStockHistory';
import { recommendationBadgeVariant, ScoreBar } from './aiEngineUi';
import { TradeEngineCard } from './TradeEngineCard';

interface AiEngineTabProps {
  stock: Stock;
}

const SCORE_LABELS: Record<keyof AiScores, string> = {
  liquidity: 'Liquidity',
  momentum: 'Momentum',
  trend: 'Trend',
  volatility: 'Volatility',
  smart_money: 'Smart Money',
  distribution: 'Distribution',
  fundamental: 'Fundamental',
};

function ProbabilityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-900">{value}%</div>
    </div>
  );
}

export function AiEngineTab({ stock }: AiEngineTabProps) {
  const history = useStockHistory(stock.ticker);

  const output = useMemo(() => {
    if (!history.ok || history.bars.length === 0) return null;
    return computeAiEngineOutput(stock, history.bars);
  }, [stock, history.ok, history.bars]);

  const tradeEngineOutput = useMemo(() => {
    if (!history.ok || history.bars.length === 0) return null;
    return computeTradeEngineOutput(stock, history.bars);
  }, [stock, history.ok, history.bars]);

  if (history.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Memuat riwayat harga {stock.ticker}...</p>
      </div>
    );
  }

  if (!history.ok || history.bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center px-6">
        <Sparkles className="w-8 h-8 mb-3 text-slate-300" />
        <p className="font-medium">Riwayat harga tidak tersedia untuk saham ini.</p>
        <p className="text-sm mt-1">AI Engine memerlukan data historis harian untuk menghitung indikator dan probabilitas.</p>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center px-6">
        <Sparkles className="w-8 h-8 mb-3 text-slate-300" />
        <p className="font-medium">Data historis belum cukup untuk analisis AI Engine.</p>
        <p className="text-sm mt-1">
          Minimum 60 hari data diperlukan, saat ini tersedia {history.bars.length} hari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tradeEngineOutput && <TradeEngineCard output={tradeEngineOutput} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <CardTitle>AI Engine (legacy) — {output.strategy}</CardTitle>
            </div>
            <p className="text-sm text-slate-500">Trend: {output.trend_category}</p>
          </div>
          <div className="text-right">
            <Badge variant={recommendationBadgeVariant(output.recommendation)} className="text-sm px-3 py-1">
              {output.recommendation}
            </Badge>
            <p className="text-xs text-slate-500 mt-1">Confidence {output.confidence}%</p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(SCORE_LABELS) as (keyof AiScores)[]).map((scoreKey) => (
            <div key={scoreKey}>
              <ScoreBar
                label={SCORE_LABELS[scoreKey]}
                value={output.scores[scoreKey]}
                invert={scoreKey === 'distribution'}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Swing Trade Probability (1-3 hari)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ProbabilityStat label="Take Profit" value={output.swing_probability.take_profit} />
            <ProbabilityStat label="Stop Loss" value={output.swing_probability.stop_loss} />
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500 mb-1">Expected Return</div>
              <div className="text-xl font-bold text-emerald-600">+{output.swing_probability.expected_return}%</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-slate-500 mb-1">Expected Drawdown</div>
              <div className="text-xl font-bold text-red-600">-{output.swing_probability.expected_drawdown}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scalping Probability (Besok)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ProbabilityStat label="Gap Up" value={output.scalping_probability.gap_up} />
            <ProbabilityStat label="Opening Strength" value={output.scalping_probability.opening_strength} />
            <ProbabilityStat label="Momentum Lanjutan" value={output.scalping_probability.momentum_continuation} />
            <ProbabilityStat label="False Breakout" value={output.scalping_probability.false_breakout} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trading Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">Entry</div>
            <div className="text-lg font-bold text-slate-900">Rp {output.entry.toLocaleString('id-ID')}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">Stop Loss</div>
            <div className="text-lg font-bold text-red-600">Rp {output.stop_loss.toLocaleString('id-ID')}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">Take Profit</div>
            <div className="text-lg font-bold text-emerald-600">
              {output.take_profit.map((tp) => `Rp ${tp.toLocaleString('id-ID')}`).join(' / ')}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">Risk : Reward</div>
            <div className="text-lg font-bold text-slate-900">{output.risk_reward}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Penjelasan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            {output.explanation.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-indigo-500">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
