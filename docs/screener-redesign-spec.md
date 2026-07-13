# Redesign Halaman Screener — Spesifikasi Desain

**Tujuan:** Investor pemula (20–45 tahun, tidak paham PER/EPS/PBV/RSI/MACD) harus mengerti "saham mana yang bagus dan kenapa" dalam <10 detik membuka halaman.

**Pertanyaan yang harus dijawab setiap layar:** (1) Saham mana yang menarik? (2) Kenapa menarik? (3) Aman atau berisiko? (4) Cocok untuk apa? (5) Kapan dibeli?

---

## 1. Analisa UX Halaman Lama

**Yang buruk:**
- `StockListView.tsx` menampilkan tabel dengan Ticker, Nama, %Chg, Harga, Vol, RVOL, Market Cap, P/E, EPS, EPS Growth, Dividend Yield, Sektor — 12 kolom sekaligus, semuanya rata secara visual (tidak ada hierarki: nama sektor sama besarnya dengan harga).
- `FilterSidebar.tsx` punya 2 slider skor, 2 input angka rentang harga, 4 checkbox quick-screen, 5 checkbox rekomendasi, 4 checkbox strategi — 15+ kontrol filter teknikal semua terbuka sekaligus, tidak ada progressive disclosure.
- Bahasa yang dipakai: "PBV < 1", "RSI < 30", "Golden Cross (EMA20 > EMA50)", "Volume Spike Aktif" — semuanya asumsikan user paham analisa teknikal.
- Tidak ada elemen yang menjawab "kenapa saham ini menarik" dalam kalimat manusia — hanya angka mentah (PER 12.3, ROE 15%).
- Tidak ada ringkasan/hero di atas halaman — user langsung dilempar ke tabel dingin tanpa konteks pasar hari ini.
- Rekomendasi hanya berupa teks singkat ("BUY", "HOLD") tanpa penjelasan tingkat keyakinan secara visual.
- Loading state: spinner generik, tidak memberi rasa "hampir selesai".
- Empty state saat filter ketat hanya teks polos "Tidak ada saham ditemukan" tanpa ilustrasi/ajakan bertindak yang hangat.
- Tidak ada dark mode, tidak ada font kustom (jatuh ke default browser font, terasa "murah").

**Yang membingungkan bagi pemula:**
- Dua sistem skor berjalan paralel (Swing Score & Scalping Score) ditampilkan berdampingan tanpa penjelasan apa bedanya atau mana yang harus diperhatikan.
- Warna scoring tidak konsisten maknanya di seluruh app (emerald untuk swing, violet untuk scalping — padahal keduanya "skor positif").
- Checklist filter pakai istilah "Golden Cross", "Oversold" tanpa tooltip.

**Yang harus dihapus/disederhanakan dari tampilan default:**
- Kolom RSI, MACD, EMA, PBV, PER, EPS, Dividend Yield sebagai default tampilan (tetap ada, tapi dipindah ke belakang: tabel opsional & halaman detail).
- 15 kontrol filter yang terbuka sekaligus (dibungkus progressive disclosure).
- Dua istilah skor teknikal ("Swing Score", "Scalping Score") sebagai label utama (diganti "AI Score" tunggal 0-100 di tampilan kartu; skor kedua tetap tersedia di tab Swing/Scalping terpisah, di luar scope redesign ini).

---

## 2. Konsep Redesign

**Filosofi: Functionalist–Scandinavian, dipandu Apple HIG.** Tenang, dapat dipercaya, minim warna, ruang napas besar — karena semua referensi user (Apple Stocks, TradingView, Robinhood, Finviz, Yahoo Finance) adalah produk finansial yang serius tapi ramah, bukan playful.

Tiga prinsip inti:
1. **Satu kartu = satu keputusan.** Setiap kartu saham menjawab kelima pertanyaan inti dalam ≤6 elemen visual, tanpa perlu scroll dalam kartu.
2. **Angka mentah adalah detail, bukan headline.** Headline adalah kata & warna (★ bintang, "Sangat Direkomendasikan", bar hijau) — angka presisi (PER 12.3x) tersedia satu klik lagi di halaman detail, bukan dihapus.
3. **Progressive disclosure di semua lapisan.** Quick filter chip menutupi 90% kebutuhan; filter teknikal lengkap ada tapi collapsed by default. Kartu ringkas di depan; detail lengkap 1 klik lagi.

---

## 3. Layout Baru (Wireframe ASCII)

### Desktop (≥1280px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo] EZYSAHAM   [Screener][Swing][Scalping][AI]   [Search]  [🔄][🔔]    │ Header
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────────┬────────────┬────────────┬────────────┬──────────────────┐ │
│ │ 🔥 48       │ 88          │ 📈 Bullish  │ Tinggi      │ 🙂 Positif       │ │ Hero Summary
│ │ Saham       │ Rata-rata   │ Momentum    │ Volume      │ Sentimen         │ │ (5 stat card)
│ │ Menarik     │ AI Score    │ Pasar       │ Pasar       │                  │ │
│ └────────────┴────────────┴────────────┴────────────┴──────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ [Semua] [🔥Rekomendasi] [🚀Momentum] [💰Murah] [📈Swing] [⚡Scalping]      │ Quick Filter Chips
│ [🏦Blue Chip] [🟢Risiko Rendah]                     ▸ Filter Lanjutan      │
├───────────────┬────────────────────────────────────────────────────────--┤
│ Filter Lanjutan│ 128 saham ditemukan            Urutkan: [AI Score ▾]     │
│ (collapsed,    │ ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│ ▸ expand)      │ │ BBRI      │ │ TLKM      │ │ ASII      │               │
│                │ │ ★★★★★     │ │ ★★★★      │ │ ★★★       │               │
│ Watchlist      │ │ Rp4.920   │ │ Rp3.150   │ │ Rp5.400   │  Card Grid    │
│ (sidebar)      │ │ +3.1%     │ │ +1.2%     │ │ -0.4%     │  3 kolom      │
│                │ │ "Volume.."│ │ "Trend.." │ │ "Valuasi.."│              │
│                │ │ ████░ Mom │ │ ███░░ Mom │ │ ██░░░ Mom │               │
│                │ │ [Cek Detail]│ │[Cek Detail]│ │[Cek Detail]│           │
│                │ └───────────┘ └───────────┘ └───────────┘               │
│                │        ... (grid berlanjut) ...                        │
└───────────────┴────────────────────────────────────────────────────────--┘
```

### Tablet (768–1023px)

```
┌───────────────────────────────────────────┐
│ [Logo]         [☰ tabs]      [🔍][🔄][☰]   │
├───────────────────────────────────────────┤
│ [🔥48][88][📈Bullish][Tinggi][🙂Positif]   │ ← Hero: scroll horizontal 5 stat
├───────────────────────────────────────────┤
│ [Semua][🔥][🚀][💰][📈][⚡][🏦][🟢] →scroll│ Quick filter chips (scrollable)
│                          ▸ Filter Lanjutan │
├───────────────────────────────────────────┤
│ 128 saham ditemukan     Urutkan: [▾]       │
│ ┌───────────────┐  ┌───────────────┐       │
│ │ BBRI  ★★★★★   │  │ TLKM  ★★★★    │       │  Card Grid 2 kolom
│ │ Rp4.920 +3.1% │  │ Rp3.150 +1.2% │       │
│ │ "Volume..."   │  │ "Trend..."    │       │
│ │ ████░ Momentum│  │ ███░░ Momentum│       │
│ │ [Cek Detail]  │  │ [Cek Detail]  │       │
│ └───────────────┘  └───────────────┘       │
└───────────────────────────────────────────┘
```

### Mobile (375–767px)

```
┌─────────────────────────┐
│ [Logo]        [🔍][🔄]   │
├─────────────────────────┤
│ 🔥 48 Saham Menarik      │
│ hari ini · AI Score 88   │  Hero: 1 kalimat + 2 angka besar
│ 📈 Bullish · Volume Tinggi│
├─────────────────────────┤
│ [Semua][🔥][🚀][💰]→scroll│ Quick filter chips
│              ▸ Lanjutan │
├─────────────────────────┤
│ 128 saham   [AI Score▾] │
│ ┌─────────────────────┐ │
│ │ BBRI        ★★★★★   │ │
│ │ Rp4.920   +3.1%      │ │  Card Grid 1 kolom
│ │ "Volume meningkat.." │ │  (full width)
│ │ ████░ Momentum       │ │
│ │ [Cek Detail →]       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ TLKM        ★★★★    │ │
│ │ ...                  │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ [🏠][📈][⚡][⭐][🔄]     │ Bottom Nav (sudah ada)
└─────────────────────────┘
```

---

## 4. Design System

**Color** (melanjutkan konvensi eksisting — bukan brand baru):
| Token | Hex/Tailwind | Makna |
|---|---|---|
| `--color-positive` | emerald-600 `#059669` | Naik, aman, direkomendasikan |
| `--color-negative` | red-500 `#ef4444` | Turun, risiko, hindari |
| `--color-neutral` | slate-500 `#64748b` | Netral, informasi sekunder |
| `--color-surface` | white / slate-900 (dark) | Latar kartu |
| `--color-bg` | slate-50 / slate-950 (dark) | Latar halaman |
| `--color-warning` | amber-500 `#f59e0b` | "Pantau" / hati-hati |

**Typography:** Plus Jakarta Sans (Google Fonts), tabular-nums untuk semua angka harga/persentase.
- Hero number: 32px/700
- Card ticker: 20px/700
- Card price: 20px/700 tabular-nums
- Body/label: 14px/500
- Micro (badge/chip): 12px/600
- Minimum di seluruh app: 14px (brief minta 14px minimum — dipenuhi)

**Spacing:** grid 8px — semua padding/gap kartu baru pakai kelipatan 8 (`p-4`=16px, `p-6`=24px, `gap-2`=8px, `gap-4`=16px), tidak lagi pakai nilai ganjil seperti `px-2.5`/`py-1.5` yang ada di komponen lama.

**Border Radius:** `rounded-2xl` (16px) untuk kartu baru (StockCard, HeroSummary, chip container) — lebih besar dari `rounded-xl` (12px) lama, kesan lebih lembut ala Apple.

**Shadow:** `shadow-sm` default, `shadow-lg` saat hover (soft, blur besar, opacity rendah — bukan shadow tajam).

**Icon:** lucide-react (sudah dipakai di seluruh app) — konsisten, ukuran 16px (inline) / 20px (aksi utama).

**Button:** pakai `Button.tsx` eksisting (`default|outline|ghost|link|danger`, size `default|sm|lg|icon`) — tidak buat varian baru.

**Card:** `Card.tsx` eksisting, radius dinaikkan ke `2xl` untuk kartu saham & hero via className override (tidak mengubah primitive global agar tabel/komponen lama tak ikut berubah tak sengaja).

**Badge:** `Badge.tsx` eksisting (`default|success|warning|danger|neutral|outline`) dipakai untuk badge bintang rekomendasi.

**Chip:** pill button custom di `QuickFilterChips.tsx` — state aktif: `bg-emerald-600 text-white`; nonaktif: `bg-white border-slate-200 text-slate-600`. Sama pola dengan chip sektor yang sudah ada di `ScreenerPage.tsx`.

**Table:** `StockListView.tsx` eksisting, tidak berubah — jadi opsi sekunder di belakang toggle.

---

## 5. Komponen UI (baru)

1. `HeroSummary` — 5 stat card ringkasan pasar.
2. `QuickFilterChips` — chip filter cepat + tombol "Filter Lanjutan".
3. `StockCard` (rewrite) — kartu saham ringkas 5-6 info.
4. `HeatBar` — bar visual untuk skor (Momentum/Likuiditas/Fundamental/Risiko).
5. `SkeletonStockCard` — placeholder loading berbentuk kartu.
6. `EmptyState` — ilustrasi + copy hangat saat hasil kosong.
7. `DetailSummaryTab` — tab "Ringkasan" di halaman detail saham.
8. `stockLabels.ts` — util murni (bukan komponen visual) untuk semua terjemahan data→bahasa awam.

---

## 6. User Flow

```
Buka app
  │
  ▼
Tab "Screener" (default) terbuka
  │
  ▼
Lihat Hero Summary → paham kondisi pasar hari ini dalam 1 lirikan
  │
  ▼
Scan Card Grid (skeleton → card, stagger fade-in)
  │
  ├─→ Tertarik 1 chip cepat (mis. "🔥 Paling Direkomendasikan")
  │        → grid ter-filter instan
  │
  ▼
Klik kartu saham yang menarik
  │
  ▼
StockDetailPage terbuka, tab "Ringkasan" aktif duluan
  → baca "Kenapa Direkomendasikan", "Risiko", "Momentum" dalam bahasa awam
  │
  ├─→ Puas dengan ringkasan → set price alert / tambah watchlist → selesai
  │
  └─→ Mau detail teknikal → pindah ke tab S.C.A.N./Technical/Fundamental (lama, tidak berubah)
```

---

## 7. Prioritas Informasi (paling penting → paling detail)

1. **Rekomendasi bintang** (★1-5 + label kata) — keputusan utama, harus terlihat pertama.
2. **Harga & perubahan hari ini** (Rp + %) — konteks langsung.
3. **1 kalimat "kenapa"** — alasan singkat, bahasa manusia.
4. **Heat Score bar** (Momentum/Likuiditas/Fundamental/Risiko) — visual, bukan angka.
5. **Ticker, nama, sektor** — identitas.
6. **CTA "Cek Detail"** — jalan ke informasi lebih dalam.
7. *(di balik klik)* Grafik harga, checklist entry/exit, level trading.
8. *(di balik klik/tab)* RSI, MACD, EMA, PBV, PER, EPS — murni untuk power user.

---

## 8. UX Improvements (vs desain lama)

1. Hero summary memberi konteks pasar sebelum user menggali data individual.
2. AI Score tunggal 0-100 menggantikan dua skor paralel yang membingungkan di tampilan default.
3. Skala bintang 1-5 menggantikan label teks polos BUY/HOLD/SELL.
4. Label kata ("Sangat Direkomendasikan") mendampingi bintang, bukan cuma ikon.
5. 1 kalimat "kenapa" per saham, diambil dari signal yang sudah dihitung backend (tidak fiktif).
6. Heat Score bar visual menggantikan angka mentah RSI/MACD/EMA di kartu.
7. Warna dibatasi hijau/merah/abu — konsisten di seluruh kartu, tidak ada indigo/violet yang membingungkan makna.
8. Quick filter chip ala Finviz/Robinhood menggantikan sidebar checkbox penuh.
9. Filter teknikal lengkap tetap ada tapi collapsed by default (progressive disclosure).
10. Toggle Card/Tabel: pemula dapat card, power user tetap bisa lihat tabel penuh.
11. Kartu hanya 5-6 info, sisanya di halaman detail — mengurangi beban kognitif.
12. Tab "Ringkasan" baru di halaman detail sebagai entry point default berbahasa awam.
13. Skeleton loading menggantikan spinner — terasa lebih cepat & memberi bentuk konten yang akan muncul.
14. Empty state dengan copy hangat & CTA "longgarkan filter" menggantikan teks datar.
15. Hover lift halus pada kartu (shadow naik + translateY) memberi umpan balik interaktif.
16. Font kustom (Plus Jakarta Sans) menggantikan default browser font — kesan lebih premium.
17. Tabular-nums pada semua angka harga — angka tidak "bergoyang" saat update live.
18. Dark mode otomatis mengikuti sistem — nyaman dipakai malam hari.
19. Radius kartu diperbesar (2xl) — kesan lebih lembut/Apple-like.
20. Grid spacing konsisten 8px di komponen baru — ritme visual lebih rapi.
21. Badge rekomendasi berwarna sesuai semantik (hijau=aman, merah=risiko) bukan sekadar abu-abu.
22. Chip filter menampilkan jumlah hasil (mis. count di sebelah label) — user tahu efek filter sebelum klik detail.
23. Sort dropdown default ke "AI Score" bukan "Perubahan Harga" — mengarahkan ke keputusan kualitas, bukan sekadar harga naik.
24. Watchlist sidebar tetap ada tapi tidak mendominasi — fokus utama tetap card grid.
25. Search tetap di header, tidak berubah posisi — tidak membuat user relearn navigasi.
26. Industry filter lama (badge sektor) dipindah ke dalam "Filter Lanjutan" — mengurangi jumlah elemen di layar utama.
27. Mobile: card full-width 1 kolom — tidak ada teks terpotong/table horizontal scroll yang menyiksa di HP.
28. Tablet: 2 kolom card — memanfaatkan lebar layar tanpa memadatkan info.
29. Desktop: 3 kolom card — rasio baca nyaman (bukan 4+ kolom yang bikin kartu terlalu kecil).
30. Minimum font 14px di semua elemen (termasuk badge/chip) — keterbacaan lebih baik dari beberapa teks 12px/`text-xs` yang ada di desain lama.
31. Kontras warna dinaikkan (slate-700 dsb.) untuk teks sekunder — sebelumnya banyak `text-slate-400` yang kontrasnya tipis.
32. CTA "Cek Detail" eksplisit di setiap kartu — sebelumnya seluruh kartu clickable tanpa penanda visual jelas kalau bisa diklik.
33. 1 sumber kebenaran label (`stockLabels.ts`) — konsistensi bahasa di seluruh halaman, tidak ada dua tempat menerjemahkan istilah berbeda.
34. Signal/why-text diambil dari data asli (`swingScore.signals`), bukan template statis acak — tetap jujur & bisa dipertanggungjawabkan.
35. Filter blueChip & risiko rendah baru — mengakomodasi 2 kebutuhan umum pemula ("saham besar yang aman", "risiko rendah") yang sebelumnya tak ada shortcut-nya.
36. Chip dividend disembunyikan (bukan ditampilkan kosong) karena data `dy` belum tersedia — mencegah dead-end UX.
37. Reset filter tetap 1 tombol, mudah ditemukan.
38. Watchlist/notifikasi bell tetap dipertahankan fungsinya di kartu baru — tidak ada fitur yang hilang.
39. Halaman detail: 7 tab lama tidak rusak — power user existing tidak kehilangan alur kerja mereka.
40. Tab "Ringkasan" jadi default — user baru tidak "tersesat" di 7 tab teknikal saat pertama kali klik kartu.
41. Motion stagger fade-in saat grid dimuat — terasa hidup tanpa mengganggu (hormati `prefers-reduced-motion`).
42. Loading skeleton berbentuk kartu (bukan generic bar) — preview bentuk konten final.
43. Angka besar & bold untuk harga — sesuai prinsip "yang penting harus paling menonjol".
44. Sub-info (sektor, waktu update) diberi warna redup — hierarki visual jelas antara primer/sekunder.
45. Search bar tetap sticky di header — akses cepat dari mana saja saat scroll.
46. Update-time indikator tetap ada di header — transparansi soal kesegaran data.
47. Toggle Card/Tabel disimpan sebagai state lokal (bukan reload) — instan tanpa flicker.
48. Semua warna baru diverifikasi kontras cukup di light & dark mode (WCAG AA untuk teks).
49. Tidak ada perubahan pada model data/backend — redesign murni presentasi, risiko regresi data minim.
50. Dokumentasi desain ini sendiri (file markdown ini) — keputusan desain terekam, bisa jadi rujukan saat memperluas ke tab Swing/Scalping/AI Screener nanti.

---

## 9. Final Mockup — Deskripsi Implementasi React + Tailwind

**`StockCard` (per item, ~280px min-width di grid):**
```
<Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900
  hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden">
  <CardContent className="p-4 space-y-3">
    {/* Row 1: ticker/nama kiri, harga+chg kanan */}
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-xl font-bold tabular-nums">{ticker}</h3>
        <p className="text-sm text-slate-500 truncate max-w-[140px]">{name}</p>
      </div>
      <div className="text-right">
        <div className="text-xl font-bold tabular-nums">Rp{price}</div>
        <div className="text-sm font-semibold {positive?'text-emerald-600':'text-red-500'}">
          {sign}{pct}%
        </div>
      </div>
    </div>

    {/* Row 2: badge bintang besar, full width */}
    <div className="rounded-xl px-3 py-2 {bg-by-tier} flex items-center gap-2">
      <span className="text-base">{stars}</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>

    {/* Row 3: 1 kalimat kenapa */}
    <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{whySummary}</p>

    {/* Row 4: 4 heat bar, 2x2 grid mobile / 1x4 desktop */}
    <div className="grid grid-cols-2 gap-2">
      <HeatBar label="Momentum" value={momentum} />
      <HeatBar label="Likuiditas" value={likuiditas} />
      <HeatBar label="Fundamental" value={fundamental} />
      <HeatBar label="Risiko" value={risiko} inverted />
    </div>

    {/* Row 5: CTA */}
    <Button size="sm" variant="outline" className="w-full">Cek Detail →</Button>
  </CardContent>
</Card>
```

**`HeatBar`:** label kecil di atas, di bawahnya 5 blok kotak (`grid grid-cols-5 gap-0.5 h-1.5`), jumlah blok terisi = `Math.round(value/20)`, blok terisi pakai warna semantik (emerald untuk value tinggi, amber medium, slate kosong) — bukan progress bar polos, agar terbaca sebagai "level" bukan persentase presisi.

**Grid container:** `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` — mengganti `<StockListView>` sebagai default, dengan `motion.div` stagger (`initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay: index*0.03}}`).

**`HeroSummary`:** `grid grid-cols-2 md:grid-cols-5 gap-3`, tiap stat adalah mini `Card` rounded-2xl dengan angka besar (`text-2xl font-bold tabular-nums`) + label kecil di bawah (`text-xs text-slate-500`).

**`QuickFilterChips`:** `flex gap-2 overflow-x-auto pb-1` (scroll horizontal di mobile/tablet, wrap di desktop), setiap chip `rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap`, state aktif solid emerald, nonaktif outline slate.

Semua kelas di atas kompatibel langsung dengan Tailwind v4 + `dark:` variant (default `prefers-color-scheme`) tanpa konfigurasi tambahan.
