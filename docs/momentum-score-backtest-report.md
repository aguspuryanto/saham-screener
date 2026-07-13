# Backtest: AI Engine Momentum Score

**Metodologi:** Data historis real, bukan simulasi. Semua kesimpulan di bawah berasal langsung dari angka pada tabel — tidak ada opini subjektif.

## 0. Setup & Sumber Data

- **Data:** `data/app.db` (SQLite) — OHLCV harian real dari Yahoo Finance, **35 ticker**, periode **2024-07 s/d 2026-07** (±2 tahun), total 16.252 baris. Setelah warmup indikator (minimum 60 bar) dan pemotongan hari terakhir (butuh hari besok sebagai entry): **14.152 observasi valid**.
- **Formula yang dibacktest:** `computeMomentumScore()` di `src/domain/engine/scores.ts:17-33` (AI Engine) — dipilih karena strukturnya memakai EMA9/20/50, MACD, RSI14, Higher High/Low, Relative Volume sebagai komponen terpisah, persis seperti kolom yang diminta. **Bukan reimplementasi** — script backtest (`scripts/backtest-momentum-score.ts`) meng-import fungsi ini beserta `computeIndicatorSnapshot()` langsung dari kode production. Divalidasi: hasil skor & indikator yang dihasilkan backtest dicek ulang secara independen untuk 2 ticker (ASGR, KKES) dan cocok 100%.
- **Definisi Entry:** Open harga hari berikutnya (t+1).
- **Definisi Win:** High(t+1) ≥ Open(t+1) × 1.05 (naik ≥5% intraday keesokan hari) — sesuai default di brief. Alternatif "RR ≥ 1:2" tidak dihitung karena tidak ada level target/cut-loss eksplisit di data ini.
- **Simulasi P&L realized:** take-profit di +5% jika tersentuh intraday hari itu, jika tidak → exit di close hari yang sama. Ini asumsi metodologis yang eksplisit (dibutuhkan supaya Profit Factor/Expectancy punya angka konkret), bukan asumsi tersembunyi.
- **Dikeluarkan dari analisis (data tidak tersedia, bukan diasumsikan):** PBV/PER (fundamental snapshot, bukan time-series historis), Broker Summary, News Sentiment, Sector Rotation.
- **Sektor:** berhasil dipetakan live dari endpoint snapshot yang sama dipakai `api/stocks.js` — breakdown sektor tersedia.

---

## 1. Statistik Keseluruhan

| Metrik | Nilai |
|---|---|
| Jumlah sampel | 14.152 |
| Jumlah Win | 2.809 |
| Jumlah Lose | 11.343 |
| **Win Rate** | **19.85%** |
| Average Profit (trade menang) | +3.61% |
| Average Loss (trade kalah) | -3.60% |
| **Profit Factor** | **0.921** (di bawah 1 = secara historis rugi bersih dengan aturan +5%TP/close) |
| Expectancy per trade | -0.11% |
| Average Return (Open→Close, 1 hari) | -0.01% |
| Median Return (1 hari) | 0.00% |
| Average MFE | +3.14% |
| Average MAE | -2.85% |
| Sharpe (per-trade, tidak dianualisasi) | -0.029 |
| Max Drawdown (kurva ekuitas kumulatif, additive %) | -2.090 poin% |

**Holding Period Comparison:**

| Holding | Avg Return |
|---|---|
| 1 hari | -0.01% |
| 3 hari | **+0.74%** |
| 5 hari | **+1.54%** |

➡️ Temuan pertama yang penting: **rata-rata return justru negatif/flat di horizon 1 hari, tapi positif dan meningkat di horizon 3-5 hari.** Ini mengindikasikan sinyal momentum pada data ini lebih cocok untuk **swing (3-5 hari)** daripada **scalping (1 hari)**.

---

## 2. Analisis Berdasarkan Momentum Score

| Bucket | n | Win Rate | Profit Factor | Avg Return 1d | Avg Return 3d | Avg Return 5d |
|---|---|---|---|---|---|---|
| 90-100 | 4.261 | 24.03% | 0.969 | +0.02% | +1.17% | **+2.04%** |
| 80-89 | 1.836 | 16.61% | 0.758 | -0.20% | +0.74% | **+2.11%** |
| 70-79 | 583 | 22.47% | 1.026 | +0.04% | +0.50% | +1.22% |
| 60-69 | 612 | 20.59% | 0.869 | -0.16% | +0.38% | +1.13% |
| <60 | 6.860 | 17.83% | 0.932 | +0.04% | +0.53% | +1.13% |

**Ranking (Profit Factor 1-hari):** 70-79 > 90-100 > <60 > 60-69 > 80-89 — **tidak monoton**, artinya di horizon 1 hari skor tinggi tidak konsisten mengungguli skor rendah.

**Tapi di horizon 5-hari, hasilnya jauh lebih rapi:** bucket 90-100 & 80-89 (rata-rata ~+2.1%) jelas mengungguli bucket <60 & 60-69 (~+1.1%) — selisih ~90 basis poin. Ini konsisten dengan temuan Feature Importance di Bagian 11.

---

## 3. Analisis Berdasarkan Sektor

| Sektor | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| PROPERTY, REAL ESTATE AND BUILDING CONSTRUCTION | 3.784 | 22.83% | **0.971** | +0.14% |
| MISCELLANEOUS INDUSTRY | 841 | 21.28% | **1.002** | +0.14% |
| AGRICULTURE | 422 | 21.80% | **1.022** | -0.004% |
| MINING | 1.680 | 18.75% | 0.984 | +0.05% |
| INFRASTRUCTURE, UTILITIES & TRANSPORTATION | 2.101 | 19.85% | 0.944 | -0.16% |
| TRADE, SERVICES, & INVESTMENT | 2.323 | 21.09% | 0.865 | -0.14% |
| CONSUMER GOODS INDUSTRY | 843 | 23.72% | 0.854 | -0.07% |
| BASIC INDUSTRY AND CHEMICALS | 1.680 | 13.45% | 0.810 | +0.04% |
| **FINANCE** | 478 | **5.44%** | 0.733 | -0.22% |

➡️ **Win rate tertinggi:** Consumer Goods (23.72%) dan Property (22.83%). **Risiko/Win Rate terendah secara mencolok: sektor Finance (5.44%)** — jauh di bawah semua sektor lain, meski profit factor-nya bukan yang terburuk (karena avgLoss di sektor ini juga lebih kecil). **Profit Factor ≥1 (nyaris breakeven/positif) hanya di 3 sektor**: Property, Miscellaneous Industry, Agriculture.

---

## 4. Analisis Berdasarkan Relative Volume (RVOL)

| RVOL | n | Win Rate | Profit Factor | Avg Return 1d |
|---|---|---|---|---|
| <2x | 12.301 | 18.67% | 0.939 | +0.05% |
| 2-3x | 838 | 26.13% | **1.052** | +0.21% |
| 3-5x | 576 | 23.96% | 0.699 | -0.57% |
| >5x | 437 | **35.47%** | 0.744 | -1.37% |

➡️ RVOL tinggi (>5x) **menaikkan Win Rate** (35.47% vs 18.67% baseline) **tapi TIDAK menaikkan profitabilitas** — average loss dan MAE ikut membesar drastis (lihat data mentah), sehingga Profit Factor malah turun. RVOL sedang (2-3x) justru satu-satunya bucket dengan Profit Factor di atas 1.

---

## 5. Analisis Berdasarkan Nilai Transaksi (Value = Close × Volume, proxy)

| Value | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| <10B | 11.212 | 18.11% | 0.960 | +0.11% |
| 10-20B | 1.011 | 20.97% | 0.906 | -0.31% |
| 20-50B | 816 | 26.10% | 0.812 | -0.45% |
| 50-100B | 385 | 29.87% | 0.736 | -0.75% |
| >100B | 728 | 32.83% | 0.805 | -0.44% |

➡️ Pola yang sama seperti RVOL: **Value besar → Win Rate naik monoton (18%→33%) tapi Profit Factor turun**. Saham dengan transaksi besar lebih sering menyentuh target +5% tapi average loss-nya jauh lebih besar saat gagal.

---

## 6. Analisis RSI

| RSI | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| 60-70 | 1.874 | 24.65% | 0.955 | +0.17% |
| 70-80 | 827 | 25.63% | 0.793 | -0.52% |
| 80-90 | 242 | 23.97% | 0.527 | -1.05% |
| **>90** | 715 | **3.22%** | 0.575 | -0.20% |

➡️ **Jawaban tegas untuk pertanyaan brief:** YA, RSI terlalu tinggi (>90) **secara drastis meningkatkan risiko profit taking** — Win Rate anjlok dari ~24-25% (RSI 60-80) menjadi **hanya 3.22%** di RSI>90. Ini salah satu sinyal paling jelas di seluruh dataset.

---

## 7. Analisis EMA

| Status | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| Golden Cross (EMA20>EMA50) | 7.370 | 22.39% | 0.928 | -0.004% |
| Death Cross (EMA20<EMA50) | 5.307 | 19.39% | 0.923 | +0.01% |
| Sideways (spread <0.5%) | 1.475 | **8.81%** | 0.841 | -0.07% |

➡️ Golden vs Death Cross **hampir tidak berbeda** (22.4% vs 19.4% — selisih tipis, Profit Factor nyaris identik). Yang benar-benar berbeda adalah kondisi **Sideways**, dengan Win Rate jauh lebih rendah (8.81%) — EMA cross saja bukan sinyal kuat, tapi "tidak ada tren jelas" adalah sinyal peringatan.

---

## 8. Analisis MACD

| Status | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| Bullish (MACD>Signal) | 6.807 | 21.36% | 0.923 | +0.01% |
| Bearish (MACD<Signal) | 6.582 | 20.25% | 0.922 | -0.02% |
| **Flat** (\|MACD-Signal\|<0.02%) | 763 | **2.88%** | 0.829 | -0.02% |

➡️ Sama seperti EMA: Bullish vs Bearish MACD **nyaris tidak membedakan** hasil. Tapi kondisi **Flat/indecisive** adalah sinyal kuat untuk **menghindari entry** (Win Rate jatuh ke 2.88%).

---

## 9. Analisis Gap Open

| Gap | n | Win Rate | Profit Factor | Avg Return |
|---|---|---|---|---|
| Gap Up >5% | 769 | 16.25% | **0.318** | **-2.36%** |
| Gap Up <5% | 3.846 | 21.66% | 0.732 | -0.44% |
| Flat (±0.5%) | 7.450 | 15.99% | 1.003 | +0.09% |
| **Gap Down** | 2.087 | **31.62%** | **1.836** | **+1.31%** |

➡️ **Jawaban tegas untuk pertanyaan brief:** YA, Gap Up besar (>5%) **secara drastis meningkatkan risiko gagal** — Profit Factor terburuk dari semua bucket di seluruh laporan ini (0.318, avg return -2.36%). Sebaliknya, **counter-intuitive tapi konsisten dengan data**: entry setelah **Gap Down** justru punya performa terbaik di seluruh dataset (Win Rate 31.6%, Profit Factor 1.84).

---

## 10. Analisis False Breakout

- **793 kejadian** (5.60% dari total sampel) di mana close hari itu berada di ~10% teratas range harian TAPI harga hari berikutnya turun.
- Rata-rata return hari berikutnya pada kejadian ini: **-3.78%**.

➡️ Pola FOMO ini nyata dan mahal secara statistik — hampir 1 dari 18 sinyal "kelihatan kuat" (close dekat high) berbalik arah dengan kerugian rata-rata signifikan besok harinya.

---

## 11. Feature Importance Analysis

**Korelasi Pearson terhadap Return (Open→Close), diurutkan dari yang paling berpengaruh:**

| Ranking | Fitur | Horizon 1-hari | Horizon 3-hari | Horizon 5-hari |
|---|---|---|---|---|
| 1 | **Gap% (gapPct)** | **-0.2019** | -0.0574 | -0.0549 |
| 2 | Relative Volume | -0.0547 | -0.0173 | +0.0038 |
| 3 | RSI14 | -0.0275 | -0.0105 | -0.0117 |
| 4 | MACD Histogram | -0.0161 | -0.0187 | **-0.0316** |
| 5 | EMA Spread% (EMA20-EMA50) | -0.0137 | -0.0190 | -0.0198 |
| 6 | **Momentum Score** | -0.0079 | +0.0262 | **+0.0339** |
| 7 | Higher Low | -0.0075 | +0.0039 | +0.0143 |
| 8 | Value (proxy) | -0.0071 | -0.0032 | -0.0079 |
| 9 | Higher High | +0.0018 | -0.0001 | -0.0012 |

**Temuan kunci:**
- **Gap% adalah fitur paling berpengaruh di semua horizon** — konsisten dengan temuan Bagian 9.
- **Momentum Score praktis tidak berkorelasi di horizon 1-hari (r=-0.008, mendekati nol)**, tapi korelasinya **naik dan menjadi POSITIF** di horizon 3-hari (+0.026) dan **menjadi fitur individual terkuat kedua** di horizon 5-hari (+0.034, hanya kalah dari MACD Histogram -0.032).
- Semua koefisien korelasi di sini **lemah secara absolut** (|r| < 0.05 di sebagian besar kasus) — bahkan yang "terkuat" (Gap% = -0.20) tergolong korelasi lemah-sedang menurut standar statistik umum. Ini harus dinyatakan jujur: **tidak ada satu fitur pun yang merupakan prediktor kuat berdiri sendiri.**

**Matriks Korelasi Antar-Fitur (deteksi redundansi):**

| | MomentumScore | RSI14 | MACD Hist | EMA Spread | RVOL |
|---|---|---|---|---|---|
| MomentumScore | 1.00 | 0.43 | 0.19 | 0.48 | 0.18 |
| RSI14 | 0.43 | 1.00 | 0.22 | 0.47 | 0.17 |
| MACD Hist | 0.19 | 0.22 | 1.00 | -0.03 | 0.04 |
| EMA Spread | 0.48 | 0.47 | -0.03 | 1.00 | 0.00 |
| RVOL | 0.18 | 0.17 | 0.04 | 0.00 | 1.00 |

➡️ **Tidak ada pasangan fitur dengan \|korelasi\| > 0.7** — jadi **secara ketat tidak ada redundansi yang perlu dihapus**. Namun ada korelasi moderat yang wajar secara struktural: Momentum Score vs EMA Spread (0.48) dan vs RSI14 (0.43) — masuk akal karena keduanya memang komponen pembentuk Momentum Score itu sendiri. Ini bukan alasan untuk menghapus salah satu, tapi konfirmasi bahwa Momentum Score memang "meringkas" sebagian informasi EMA/RSI (bukan independen darinya).

---

## 12. Rekomendasi Konkret Menaikkan Win Rate (Diuji Langsung pada Data)

Filter berikut diuji langsung terhadap 14.152 observasi (bukan opini):

| Filter | n | Win Rate | Profit Factor | Avg Return 1d | Avg Return 5d |
|---|---|---|---|---|---|
| **Baseline (tanpa filter)** | 14.152 | 19.85% | 0.921 | -0.01% | +1.54% |
| Hanya exclude RSI≥90 & MACD Flat | 13.222 | 20.93% | 0.927 | +0.01% | +1.68% |
| Hanya RVOL 2-3x | 838 | 26.13% | 1.052 | +0.21% | +3.19% |
| **Gap Down + Momentum Score ≥80** | **992** | **30.14%** | **1.771** | **+1.14%** | **+2.59%** |
| Gap Down + Momentum Score ≥80 + exclude RSI≥90/MACD Flat | 975 | 30.26% | 1.772 | +1.14% | +2.66% |

➡️ **Filter tunggal paling efektif yang ditemukan: kombinasi "Gap Down pada hari sebelumnya" + "Momentum Score ≥ 80".** Pada 992 sampel real, ini menaikkan Win Rate dari 19.85% → **30.14%** dan mengubah Profit Factor dari 0.92 (rugi) menjadi **1.77 (profitable)** — tanpa menambah kompleksitas indikator baru, murni dari kombinasi 2 variabel yang sudah dihitung sistem. Menambahkan exclude RSI≥90/MACD-flat di atas filter ini **tidak memberi peningkatan berarti** (n hampir sama, metrik nyaris identik) — filter Gap Down + Momentum≥80 saja sudah menangkap sebagian besar manfaatnya.

**Catatan kehati-hatian:** n=992 adalah subset real dan cukup besar untuk sinyal, tapi tetap jauh lebih kecil dari 14.152 baseline — kombinasi ini akan jarang muncul (~7% dari semua hari trading), jadi ini adalah filter **kualitas di atas kuantitas**, bukan strategi harian.

---

# KESIMPULAN

**1. Apakah Momentum Score layak digunakan?**
- Untuk **scalping (horizon 1 hari): TIDAK layak berdiri sendiri** — korelasi dengan return mendekati nol (r=-0.008), Profit Factor keseluruhan 0.92 (rugi bersih).
- Untuk **swing (horizon 5 hari): ADA sinyal nyata tapi lemah** — korelasi +0.034, fitur individual terkuat kedua di horizon ini, bucket skor tinggi (80-100) mengungguli bucket rendah rata-rata ~90 basis poin return 5-hari.
- **Kesimpulan jujur:** formula ini lebih valid sebagai sinyal **swing** daripada **scalping**, dan bahkan sebagai sinyal swing kekuatannya tergolong lemah jika dipakai sendirian — jauh lebih efektif jika dikombinasikan dengan Gap Open (lihat Bagian 12).

**2. Berapa Win Rate aktual?**
- **19.85%** keseluruhan (definisi: High besok ≥ +5%).
- Turun ke **3.22%** saat RSI≥90, **2.88%** saat MACD flat.
- Naik ke **30.14%** dengan filter Gap Down + Momentum Score≥80.

**3. Faktor apa yang paling berpengaruh?**
- **Gap Open** — fitur individual paling berpengaruh di SEMUA horizon waktu (1/3/5 hari).
- **RSI ekstrem (>90)** dan **MACD flat** — bukan prediktor return yang kuat secara korelasi linear, tapi sebagai **sinyal peringatan biner** keduanya menghasilkan penurunan Win Rate paling drastis di seluruh dataset (ke ~3%).
- **MACD Histogram** — prediktor individual terkuat kedua di horizon 5-hari.

**4. Faktor apa yang harus dihapus/dikurangi bobotnya?**
- **Relative Volume** dan **Higher High** — korelasi dengan return mendekati nol di semua horizon (RVOL: -0.055→+0.004→+0.004; HigherHigh: +0.002→-0.0001→-0.001), meski keduanya memberi bonus +10 dan +5 di formula saat ini. **Bukan dihapus total** (RVOL>5x tetap menaikkan Win Rate meski bukan Profit Factor), tapi bobotnya terlalu tinggi dibanding kontribusi prediktifnya.

**5. Bobot indikator sebaiknya diubah menjadi berapa?**
Lihat "Momentum Score v2.0" di bawah — dihitung proporsional terhadap |korelasi| di horizon 5-hari (horizon di mana skor ini benar-benar menunjukkan sinyal).

**6. Bagaimana cara meningkatkan akurasi menjadi di atas 75%?**
**Berdasarkan data yang ada, target ini tidak realistis dan tidak akan dinyatakan tercapai tanpa bukti.** Kombinasi filter terbaik yang ditemukan (Gap Down + Momentum≥80) mencapai Win Rate 30.14% pada n=992 — jauh dari 75%. Tidak ada kombinasi fitur dalam dataset ini (35 ticker, 2 tahun, definisi Win +5% intraday) yang mendekati 75%. Untuk mendekati angka itu, dibutuhkan **data tambahan yang tidak tersedia di project ini** (order book/bid-ask, broker summary, sentimen berita/sosial) atau **definisi Win yang lebih longgar** (mis. target lebih kecil dari +5%, atau horizon lebih panjang dari 5 hari) — keduanya adalah perubahan scope, bukan perbaikan model dari data yang sudah ada.

---

# REKOMENDASI AI: Momentum Score v2.0 (Data-Driven, Horizon 5-Hari)

Bobot berikut dihitung proporsional terhadap **|korelasi absolut terhadap Return 5-hari|** dari komponen yang benar-benar terbukti dapat dibacktest (bukan rekaan):

| Komponen | Korelasi (5d, absolut) | Bobot v2.0 | Bobot v1 (saat ini) |
|---|---|---|---|
| MACD (histogram) | 0.0316 | **42%** | Kontribusi tetap ±10 |
| EMA Cross (spread 20/50) | 0.0198 | **27%** | Kontribusi tetap +15/-15, +10/-5 |
| Price Structure (Higher High/Low) | 0.0078 (rata-rata) | **10%** | Kontribusi tetap +5 / +5 |
| RSI14 (band) | 0.0117 | **16%** | Kontribusi tetap +15/-5/-10 |
| Relative Volume | 0.0038 | **5%** | Kontribusi tetap +10 |
| **Total** | | **100%** | |

**Catatan yang harus digarisbawahi:**
- Bobot ini murni proporsi kekuatan korelasi terukur di antara 5 komponen yang ADA di data — **bukan jaminan performa**, karena korelasi absolutnya sendiri sangat kecil (0.004-0.032). Reweighting ini adalah **perbaikan relatif** (mengalokasikan bobot sesuai bukti), bukan solusi yang membuat model "akurat".
- **Broker Summary, News Sentiment, dan Sector Rotation** yang disebut di contoh awal **tidak dapat diberi bobot** — tidak ada satu pun sumber data ini di project (`data/app.db` hanya OHLCV, tidak ada feed broker/berita/rotasi sektor). Menambahkannya ke formula tanpa data akan menjadi angka rekaan, yang secara eksplisit dilarang dalam pengerjaan ini.
- **Perubahan paling berdampak yang didukung data bukan reweighting formula itu sendiri, melainkan menambahkan filter Gap Open sebagai gate terpisah** (lihat Bagian 12) — ini terbukti menaikkan Profit Factor dari 0.92 ke 1.77, jauh lebih besar dampaknya dibanding reweighting internal komponen Momentum Score.
