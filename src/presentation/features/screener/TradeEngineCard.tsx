import { TradeEngineOutput, TradeEngineScores } from '../../../domain/models/TradeEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreBar } from './aiEngineUi';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TradeEngineCardProps {
  output: TradeEngineOutput;
}

const SCORE_LABELS: Record<keyof Omit<TradeEngineScores, 'composite'>, string> = {
  trend: 'Trend',
  momentum: 'Momentum',
  liquidity: 'Liquidity',
  smartMoney: 'Smart Money',
  risk: 'Risk (safety)',
  falseBreakout: 'False Breakout (safety)',
  riskReward: 'Risk:Reward',
  openingStrength: 'Opening Strength (estimasi)',
};

function decisionBadgeVariant(decision: TradeEngineOutput['decision']): 'success' | 'warning' | 'danger' {
  if (decision === 'BUY') return 'success';
  if (decision === 'WATCH') return 'warning';
  return 'danger';
}

/**
 * This card's math (entry/stop/target/RR from EOD bars) is real and useful as a
 * next-day plan — but "BUY" from after-market data alone is exactly the
 * overconfidence pattern that produced bad calls (e.g. BKDP: EOD signals looked
 * perfect, gapped up and sold off -9% at the open). Stage 2/3 live opening-auction
 * validation isn't available in this app yet (see Pipeline tab), so the decision
 * is relabeled to make that gap explicit rather than presenting a false BUY signal.
 */
function decisionDisplayLabel(decision: TradeEngineOutput['decision']): string {
  if (decision === 'BUY') return 'Siap Dieksekusi (Preview EOD)';
  if (decision === 'WATCH') return 'Watchlist';
  return 'No Trade';
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div
        className={cn(
          'text-lg font-bold',
          tone === 'good' && 'text-emerald-600',
          tone === 'bad' && 'text-red-600',
          (!tone || tone === 'neutral') && 'text-slate-900'
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function TradeEngineCard({ output }: TradeEngineCardProps) {
  const isNoTrade = output.decision === 'NO_TRADE';

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          'border-2',
          output.decision === 'BUY' && 'border-emerald-300 bg-emerald-50/40',
          output.decision === 'WATCH' && 'border-amber-300 bg-amber-50/40',
          isNoTrade && 'border-red-300 bg-red-50/40'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-slate-500" />
              <CardTitle>Rencana Eksekusi — Preview dari data EOD</CardTitle>
            </div>
            <p className="text-sm text-slate-500">Grade {output.grade} · Confidence {output.confidence}%</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-900">
              {output.scores.composite}
              <span className="text-base font-medium text-slate-400">/100</span>
            </div>
            <Badge variant={decisionBadgeVariant(output.decision)} className="mt-1 text-sm px-3 py-1">
              {decisionDisplayLabel(output.decision)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Preview dari data EOD — bukan rekomendasi final. Wajib divalidasi ulang saat opening (08:55–09:10)
            sebelum eksekusi; lihat tab Pipeline.
          </p>
        </CardContent>
        {output.noTradeReasons.length > 0 && (
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {output.noTradeReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">6 Layer Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(SCORE_LABELS) as (keyof typeof SCORE_LABELS)[]).map((key) => (
            <ScoreBar key={key} label={SCORE_LABELS[key]} value={output.scores[key]} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Probabilitas & Expected Value</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Estimasi berbasis aturan (heuristik), bukan hasil model yang telah dibacktest secara statistik.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Prob. Take Profit" value={`${output.probabilityTakeProfit}%`} tone="good" />
          <Stat label="Prob. Stop Loss" value={`${output.probabilityStopLoss}%`} tone="bad" />
          <Stat label="No Trade Prob." value={`${output.noTradeProbability}%`} />
          <Stat
            label="Expected Return"
            value={`${output.expectedReturnPct >= 0 ? '+' : ''}${output.expectedReturnPct}%`}
            tone={output.expectedReturnPct >= 0 ? 'good' : 'bad'}
          />
          <Stat label="Expected Drawdown" value={`-${output.expectedDrawdownPct}%`} tone="bad" />
          <Stat label="Risk:Reward" value={`1:${output.riskRewardRatio.toFixed(1)}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trading Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label="Entry Zone"
            value={`Rp ${output.entryZone[0].toLocaleString('id-ID')} - ${output.entryZone[1].toLocaleString('id-ID')}`}
          />
          <Stat label="Stop Loss" value={`Rp ${output.stopLoss.toLocaleString('id-ID')}`} tone="bad" />
          <Stat
            label="Take Profit"
            value={output.takeProfit.map((tp) => `Rp ${tp.toLocaleString('id-ID')}`).join(' / ')}
            tone="good"
          />
          <Stat label="Max Position Size" value={`${output.maxPositionSizePct}% modal`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hard Gates (Semua Harus Terpenuhi)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {output.gates.map((g, i) => (
              <li key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                <span className="flex items-center gap-2 text-slate-700">
                  {g.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  {g.label}
                </span>
                <span className={cn('font-semibold', g.passed ? 'text-emerald-600' : 'text-red-500')}>{g.detail}</span>
              </li>
            ))}
          </ul>
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
                <span className="text-slate-400">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
