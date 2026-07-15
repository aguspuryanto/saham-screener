import { useMemo, useState } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { WatchlistOutput, WatchlistTier } from '../../../domain/models/Watchlist';
import { cn } from '../../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { ScoreBar } from './aiEngineUi';
import { GuideBox, GuideTip, CollapsibleGuide } from './HowToReadGuide';
import { useWatchlistScreener, WatchlistScreenerStatus } from './useWatchlistScreener';
import { ListChecks, Star, ArrowUpRight, ArrowDownRight, RefreshCw, Info } from 'lucide-react';

interface WatchlistAiTabProps {
  stocks: Stock[];
  loading: boolean;
  onStockClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  favorites: Set<string>;
}

const TOP_N = 30;

const TIER_LABEL: Record<WatchlistTier, string> = {
  ELITE: 'Elite Watchlist',
  VERY_GOOD: 'Very Good',
  WORTH_WATCHING: 'Worth Watching',
  NO_TRADE: 'No Trade',
};

function tierBadgeVariant(tier: WatchlistTier): 'success' | 'warning' | 'neutral' | 'danger' {
  if (tier === 'ELITE') return 'success';
  if (tier === 'VERY_GOOD') return 'success';
  if (tier === 'WORTH_WATCHING') return 'warning';
  return 'danger';
}

function StatusChip({ status, barsAvailable }: { status: WatchlistScreenerStatus; barsAvailable?: number }) {
  if (status === 'idle') return <span className="text-xs text-slate-400">Belum dianalisis</span>;
  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <RefreshCw className="w-3 h-3 animate-spin" /> Menganalisis...
      </span>
    );
  }
  if (status === 'no-history') {
    return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Riwayat tidak tersedia</span>;
  }
  if (status === 'insufficient-bars') {
    return (
      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
        Data {'<'} 60 hari{barsAvailable != null ? ` (tersedia ${barsAvailable})` : ''}
      </span>
    );
  }
  return null;
}

interface WatchlistCardProps {
  rank: number;
  stock: Stock;
  status: WatchlistScreenerStatus;
  output: WatchlistOutput | null;
  onClick: (stock: Stock) => void;
  onToggleFavorite: (stock: Stock) => void;
  isFavorite: boolean;
}

function WatchlistCard({ rank, stock, status, output, onClick, onToggleFavorite, isFavorite }: WatchlistCardProps) {
  const isPositive = stock.percentChange >= 0;
  const rankBg =
    rank === 1 ? 'bg-amber-400 text-white' :
    rank === 2 ? 'bg-slate-400 text-white' :
    rank === 3 ? 'bg-amber-600 text-white' :
    'bg-slate-100 text-slate-600';

  return (
    <div
      onClick={() => onClick(stock)}
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg}`}>
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">{stock.ticker}</span>
              <span className={cn('flex items-center text-xs font-semibold', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stock.percentChange).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[160px]">{stock.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(stock); }}
            className={cn('p-1.5 rounded-full transition-colors', isFavorite ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-slate-500')}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-emerald-600' : ''}`} />
          </button>
          {output && (
            <Badge variant={tierBadgeVariant(output.tier)} className="text-xs px-2.5 py-1">
              {TIER_LABEL[output.tier]}
            </Badge>
          )}
        </div>
      </div>

      {!output ? (
        <div className="py-2">
          <StatusChip status={status} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Skor Watchlist</span>
            <span className="font-bold text-slate-900 text-base">{output.finalScore}/100</span>
          </div>
          <div className="space-y-1.5">
            <ScoreBar label="Momentum" value={output.categories.momentum} />
            <ScoreBar label="Structure" value={output.categories.structure} />
          </div>
          {output.penalties.length > 0 && (
            <p className="mt-2 text-xs text-red-600">
              -{output.penalties.reduce((s, p) => s + p.points, 0)} penalty: {output.penalties.map((p) => p.label).join(', ')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function WatchlistHowToReadGuide() {
  return (
    <CollapsibleGuide label="Cara Membaca Watchlist AI Mode">
      <GuideBox color="emerald" badge="TIER" title="Tier Watchlist (dari Skor 0–100)">
        <p><span className="font-semibold text-emerald-700">ELITE (≥ 90)</span> — kualitas setup terbaik, semua kategori mendukung.</p>
        <p><span className="font-semibold text-emerald-700">VERY_GOOD (≥ 80)</span> — sangat layak dipantau.</p>
        <p><span className="font-semibold text-amber-700">WORTH_WATCHING (≥ 70)</span> — cukup menarik, tetap perlu konfirmasi.</p>
        <p><span className="font-semibold text-red-600">NO_TRADE (&lt; 70)</span> — belum layak masuk watchlist besok.</p>
      </GuideBox>

      <GuideBox color="blue" badge="SKOR" title="Skor Watchlist Tersusun dari 5 Kategori">
        <p><span className="font-semibold">Momentum (30%)</span> — kekuatan tren &amp; posisi harga terhadap EMA/RSI/MACD (satu-satunya breakdown yang tampil di kartu bersama Structure).</p>
        <p><span className="font-semibold">Liquidity (25%)</span> — kecukupan nilai transaksi &amp; volume relatif.</p>
        <p><span className="font-semibold">Smart Money (20%)</span> — estimasi akumulasi dari RVOL &amp; posisi close (proksi, bukan data broker riil).</p>
        <p><span className="font-semibold">Structure (15%)</span> — pola higher-high/higher-low dan breakout struktur harga.</p>
        <p><span className="font-semibold">Risk (10%)</span> — kesehatan volatilitas; skor akhir juga dikurangi penalty jika ada sinyal bahaya.</p>
      </GuideBox>

      <GuideBox color="red" badge="PENALTY" title="Baris Merah di Bawah Skor">
        <p>Pengurangan poin dari sinyal risiko spesifik — misalnya gap terlalu besar, terlalu dekat resistance, sinyal distribusi, atau kenaikan harga yang sudah terlalu ekstrem dalam waktu singkat. Semakin banyak penalty, semakin besar kemungkinan skor akhirnya turun ke tier lebih rendah.</p>
      </GuideBox>

      <GuideBox color="violet" badge="KONTROL" title="Tombol & Filter di Atas Daftar">
        <p><span className="font-semibold">Jalankan Watchlist Engine</span> — mengambil data historis tiap saham lalu menghitung skor; makin banyak saham, makin lama prosesnya (lihat progress bar).</p>
        <p><span className="font-semibold">Tampilkan No Trade</span> — jika dicentang, saham dengan tier NO_TRADE ikut ditampilkan (default disembunyikan agar fokus ke kandidat terbaik).</p>
        <p><span className="font-semibold">Riwayat tidak tersedia / Data {'<'} 60 hari</span> — status saat data historis saham belum cukup untuk dihitung skornya.</p>
      </GuideBox>

      <GuideTip>
        <span className="font-semibold">Tip:</span> Jalankan ini setelah market tutup untuk menyusun watchlist besok pagi. Skor tinggi bukan berarti "beli sekarang" —
        tetap validasi ulang saat market dibuka (candlestick, volume pembukaan) sebelum entry, terutama untuk tier WORTH_WATCHING ke bawah.
      </GuideTip>
    </CollapsibleGuide>
  );
}

export function WatchlistAiTab({ stocks, loading, onStockClick, onToggleFavorite, favorites }: WatchlistAiTabProps) {
  const [showNoTrade, setShowNoTrade] = useState(false);
  const { results, statusByTicker, progress, isRunning, run } = useWatchlistScreener();

  const candidates = useMemo(() => {
    return [...stocks]
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_N * 3);
  }, [stocks]);

  const ranked = useMemo(() => {
    return candidates
      .map((stock) => ({ stock, output: results.get(stock.ticker) ?? null }))
      .filter((r) => showNoTrade || !r.output || r.output.tier !== 'NO_TRADE')
      .sort((a, b) => (b.output?.finalScore ?? -1) - (a.output?.finalScore ?? -1))
      .slice(0, TOP_N);
  }, [candidates, results, showNoTrade]);

  const hasRun = candidates.some((s) => statusByTicker.has(s.ticker));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-2xl mb-4">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm">Memuat data saham...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm bg-emerald-50 border border-emerald-100 text-emerald-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Stage 1 — After Market AI:</strong> Ini bukan sinyal BUY/SELL. Ini watchlist generator — menyaring
          saham yang <em>layak dipantau</em> besok pagi, bukan yang "pasti naik". Validasi lanjutan saat opening
          (08:55–09:10) belum tersedia di aplikasi ini (butuh data orderbook/broker realtime).
        </p>
      </div>

      <WatchlistHowToReadGuide />

      <div className="flex items-center justify-between mb-5 bg-white rounded-xl border border-slate-200 p-3.5">
        <div className="text-sm text-slate-600">
          {isRunning
            ? `Menganalisis ${progress.done}/${progress.total} saham...`
            : hasRun
              ? 'Analisis selesai. Klik lagi untuk memuat ulang.'
              : `Siap menganalisis ${candidates.length} saham (diurutkan dari nilai transaksi tertinggi).`}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={showNoTrade} onChange={(e) => setShowNoTrade(e.target.checked)} />
            Tampilkan No Trade
          </label>
          <button
            onClick={() => run(candidates)}
            disabled={isRunning || candidates.length === 0}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
              isRunning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            <ListChecks className={cn('w-4 h-4', isRunning && 'animate-pulse')} />
            Jalankan Watchlist Engine
          </button>
        </div>
      </div>

      {isRunning && progress.total > 0 && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-5">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ranked.map((r, i) => (
          <WatchlistCard
            key={r.stock.id}
            rank={i + 1}
            stock={r.stock}
            status={statusByTicker.get(r.stock.ticker) ?? 'idle'}
            output={r.output}
            onClick={onStockClick}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.has(r.stock.id)}
          />
        ))}
      </div>

      {ranked.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada hasil. Jalankan Watchlist Engine di atas.</p>
        </div>
      )}
    </div>
  );
}
