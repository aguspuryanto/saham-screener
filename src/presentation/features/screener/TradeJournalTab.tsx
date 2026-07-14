import { useEffect, useState, FormEvent } from 'react';
import { TradeJournalEntry } from '../../../domain/models/TradeJournal';
import { fetchJournalEntries, createJournalEntry } from '../../../data/repositories/TradeJournalRepository';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, Loader2, Info } from 'lucide-react';
import { cn } from '../../../utils/cn';

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

const EMPTY_FORM: TradeJournalEntry = {
  ticker: '',
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

export function TradeJournalTab() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TradeJournalEntry>(EMPTY_FORM);

  useEffect(() => {
    fetchJournalEntries().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ticker.trim()) return;

    setSaving(true);
    const saved = await createJournalEntry(form);
    setSaving(false);

    if (saved) {
      setEntries((prev) => [saved, ...prev]);
      setForm(EMPTY_FORM);
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
                placeholder="BKDP"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Watchlist Score</label>
              <input
                type="number"
                className={inputClass}
                value={form.watchlistScore ?? ''}
                onChange={(e) => setForm({ ...form, watchlistScore: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Watchlist Tier</label>
              <select
                className={inputClass}
                value={form.watchlistTier ?? ''}
                onChange={(e) => setForm({ ...form, watchlistTier: e.target.value })}
              >
                <option value="">-</option>
                <option value="ELITE">Elite Watchlist</option>
                <option value="VERY_GOOD">Very Good</option>
                <option value="WORTH_WATCHING">Worth Watching</option>
                <option value="NO_TRADE">No Trade</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                className={inputClass}
                value={form.entryPrice ?? ''}
                onChange={(e) => setForm({ ...form, entryPrice: toNumberOrNull(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input
                type="number"
                className={inputClass}
                value={form.exitPrice ?? ''}
                onChange={(e) => setForm({ ...form, exitPrice: toNumberOrNull(e.target.value) })}
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
                    <th className="py-2 pr-3">Tanggal</th>
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
                        {e.loggedAt ? new Date(e.loggedAt).toLocaleDateString('id-ID') : '-'}
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
