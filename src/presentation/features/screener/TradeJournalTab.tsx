import { useEffect, useState, FormEvent } from 'react';
import { TradeJournalEntry } from '../../../domain/models/TradeJournal';
import { WatchlistTier } from '../../../domain/models/Watchlist';
import { fetchJournalEntries, createJournalEntry } from '../../../data/repositories/TradeJournalRepository';
import { computeHistoricalWatchlistScore } from '../../../domain/engine/watchlistLookup';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, Loader2, Info, RefreshCw } from 'lucide-react';
import { cn } from '../../../utils/cn';

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

const TIER_LABEL: Record<WatchlistTier, string> = {
  ELITE: 'Elite Watchlist',
  VERY_GOOD: 'Very Good',
  WORTH_WATCHING: 'Worth Watching',
  NO_TRADE: 'No Trade',
};

function tierBadgeVariant(tier: WatchlistTier): 'success' | 'warning' | 'danger' {
  if (tier === 'ELITE' || tier === 'VERY_GOOD') return 'success';
  if (tier === 'WORTH_WATCHING') return 'warning';
  return 'danger';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: TradeJournalEntry = {
  ticker: '',
  entryDate: todayIso(),
  exitDate: '',
  watchlistScore: null,
  watchlistTier: '',
  entryPrice: null,
  exitPrice: null,
  stopLoss: null,
  takeProfit: null,
  resultPct: null,
  maxDrawdownPct: null,
  maxProfitIntradayPct: null,
  entryReason: '',
  exitReason: '',
};

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type ScoreStatus = 'idle' | 'loading' | 'done' | 'error';

export function TradeJournalTab() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TradeJournalEntry>(EMPTY_FORM);
  const [scoreStatus, setScoreStatus] = useState<ScoreStatus>('idle');

  useEffect(() => {
    fetchJournalEntries().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const updateForm = (patch: Partial<TradeJournalEntry>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (next.entryPrice != null && next.exitPrice != null && next.entryPrice !== 0) {
        next.resultPct = Number((((next.exitPrice - next.entryPrice) / next.entryPrice) * 100).toFixed(2));
      }
      return next;
    });
  };

  const runScoreLookup = async () => {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker) return;

    setScoreStatus('loading');
    const output = await computeHistoricalWatchlistScore(ticker, form.entryDate || todayIso());

    if (output) {
      setForm((prev) => ({ ...prev, watchlistScore: output.finalScore, watchlistTier: output.tier }));
      setScoreStatus('done');
    } else {
      setForm((prev) => ({ ...prev, watchlistScore: null, watchlistTier: '' }));
      setScoreStatus('error');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ticker.trim()) return;

    setSaving(true);
    const saved = await createJournalEntry(form);
    setSaving(false);

    if (saved) {
      setEntries((prev) => [saved, ...prev]);
      setForm({ ...EMPTY_FORM, entryDate: todayIso() });
      setScoreStatus('idle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-3.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Catat setiap rekomendasi dan hasil aktualnya secara manual di sini. Setelah terkumpul 500-1.000 entri,
          data ini dipakai untuk mengevaluasi bobot skoring mana yang benar-benar berkontribusi terhadap kemenangan
          — analisis itu belum tersedia, tab ini baru untuk mencatat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Catat Entri Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Ticker *</label>
              <input
                className={inputClass}
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                onBlur={runScoreLookup}
                placeholder="BKDP"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tanggal Entry</label>
              <input
                type="date"
                className={inputClass}
                value={form.entryDate ?? ''}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                onBlur={runScoreLookup}
              />
            </div>
            <div>
              <label className={labelClass}>Tanggal Exit</label>
              <input
                type="date"
                className={inputClass}
                value={form.exitDate ?? ''}
                onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Watchlist Score (AI Engine)</label>
              <div className="flex items-center gap-2 h-[38px]">
                {scoreStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : scoreStatus === 'done' && form.watchlistScore != null && form.watchlistTier ? (
                  <>
                    <span className="font-semibold text-slate-900">{form.watchlistScore}</span>
                    <Badge variant={tierBadgeVariant(form.watchlistTier as WatchlistTier)}>
                      {TIER_LABEL[form.watchlistTier as WatchlistTier] ?? form.watchlistTier}
                    </Badge>
                  </>
                ) : scoreStatus === 'error' ? (
                  <span className="text-xs text-slate-400">Data historis tidak cukup</span>
                ) : (
                  <span className="text-xs text-slate-400">Isi ticker untuk menghitung</span>
                )}
                <button
                  type="button"
                  onClick={runScoreLookup}
                  className="ml-auto text-slate-400 hover:text-emerald-600"
                  title="Hitung ulang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                className={inputClass}
                value={form.entryPrice ?? ''}
                onChange={(e) => updateForm({ entryPrice: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input
                type="number"
                className={inputClass}
                value={form.exitPrice ?? ''}
                onChange={(e) => updateForm({ exitPrice: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                className={inputClass}
                value={form.stopLoss ?? ''}
                onChange={(e) => setForm({ ...form, stopLoss: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Take Profit</label>
              <input
                type="number"
                className={inputClass}
                value={form.takeProfit ?? ''}
                onChange={(e) => setForm({ ...form, takeProfit: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Hasil (%)</label>
              <input
                type="number"
                className={inputClass}
                value={form.resultPct ?? ''}
                onChange={(e) => setForm({ ...form, resultPct: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Max Drawdown (%)</label>
              <input
                type="number"
                className={inputClass}
                value={form.maxDrawdownPct ?? ''}
                onChange={(e) => setForm({ ...form, maxDrawdownPct: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Max Profit Intraday (%)</label>
              <input
                type="number"
                className={inputClass}
                value={form.maxProfitIntradayPct ?? ''}
                onChange={(e) => setForm({ ...form, maxProfitIntradayPct: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Alasan Entry</label>
              <input
                className={inputClass}
                value={form.entryReason ?? ''}
                onChange={(e) => setForm({ ...form, entryReason: e.target.value })}
                placeholder="EMA golden, volume 3x, RR 1:2.5"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Alasan Exit</label>
              <input
                className={inputClass}
                value={form.exitReason ?? ''}
                onChange={(e) => setForm({ ...form, exitReason: e.target.value })}
                placeholder="Kena stop loss, gap down offer menumpuk"
              />
            </div>
            <div className="col-span-2 sm:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                {saving ? 'Menyimpan...' : 'Simpan Entri'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Jurnal ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Belum ada entri jurnal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-3">Tgl Entry</th>
                    <th className="py-2 pr-3">Tgl Exit</th>
                    <th className="py-2 pr-3">Ticker</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Entry</th>
                    <th className="py-2 pr-3">Exit</th>
                    <th className="py-2 pr-3">Hasil</th>
                    <th className="py-2 pr-3">Alasan Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50">
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                        {e.entryDate ? new Date(e.entryDate).toLocaleDateString('id-ID') : (e.loggedAt ? new Date(e.loggedAt).toLocaleDateString('id-ID') : '-')}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                        {e.exitDate ? new Date(e.exitDate).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-slate-900">{e.ticker}</td>
                      <td className="py-2 pr-3">{e.watchlistTier && <Badge variant="neutral">{e.watchlistTier}</Badge>}</td>
                      <td className="py-2 pr-3">{e.entryPrice ?? '-'}</td>
                      <td className="py-2 pr-3">{e.exitPrice ?? '-'}</td>
                      <td className={cn('py-2 pr-3 font-semibold', (e.resultPct ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {e.resultPct != null ? `${e.resultPct}%` : '-'}
                      </td>
                      <td className="py-2 pr-3 text-slate-600 max-w-xs truncate">{e.entryReason ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
