Menurut saya, sebaiknya AI **tidak diminta memprediksi harga**, tetapi **memprediksi probabilitas keberhasilan sebuah setup trading**. Ini jauh lebih realistis, mudah di-backtest, dan bisa terus ditingkatkan berdasarkan hasil historis.

Berikut prompt yang saya sarankan untuk Claude (Plan Mode atau Code Mode) agar menghasilkan AI engine yang konsisten.

---

# PROMPT AI

## Role

```text
Anda adalah Quant Researcher, Stock Trader, Machine Learning Engineer, dan Software Architect.

Tugas Anda adalah merancang AI Stock Screening Engine untuk Bursa Efek Indonesia (IDX).

Tujuan aplikasi BUKAN memprediksi harga saham.

Tujuan utama adalah menghitung probabilitas keberhasilan sebuah setup trading berdasarkan data End Of Day (EOD).

Output AI harus membantu trader mengurangi keputusan emosional (FOMO) dan hanya memilih saham dengan probabilitas tinggi.

AI harus dapat melakukan backtesting sehingga seluruh scoring dapat terus diperbaiki berdasarkan histori.

Gunakan pendekatan Rule Based + Probability Scoring.

JANGAN menggunakan random prediction ataupun LLM hallucination.

Seluruh keputusan harus dapat dijelaskan.
```

---

# DATA YANG TERSEDIA

```text
Data berasal dari API PasarDana.

Data diperoleh setelah market tutup.

Tidak ada data realtime.

Tidak ada broker summary.

Tidak ada orderbook.

Tidak ada tick.

Data yang tersedia antara lain:

Kode Saham

Nama

Open

High

Low

Close

Volume

Value

Change %

Market Cap

PE

PBV

EPS

ROE

DER

Dividend

Foreign Buy

Foreign Sell

History minimal 250 hari.
```

---

# TUJUAN AI

```text
AI harus menghasilkan probabilitas keberhasilan trading, bukan prediksi harga.

Output utama:

1.
Swing Trade (1-3 hari)

Probabilitas Take Profit

Probabilitas Stop Loss

Expected Return

Expected Risk

Confidence Score

2.
Scalping Besok

Probabilitas Gap Up

Probabilitas Opening Strength

Probabilitas Momentum Lanjutan

Probabilitas False Breakout

Confidence Score

3.

Overall Recommendation

BUY

WATCHLIST

WAIT

AVOID
```

---

# INDIKATOR YANG HARUS DIHITUNG

AI wajib menghitung:

```text
EMA 5

EMA 9

EMA 20

EMA 50

MA20

MA50

RSI14

MACD

ATR14

Bollinger Band

Stochastic

ADX

Volume MA20

Relative Volume

Average Transaction Value

Average Daily Range

Support

Resistance

Highest High 20

Lowest Low 20

Higher High

Higher Low

Gap

Body %

Upper Shadow %

Lower Shadow %

Bullish Engulfing

Bearish Engulfing

Morning Star

Hammer

Shooting Star

Doji

Inside Bar

Outside Bar
```

---

# AI SCORING

AI harus membuat beberapa score.

## Liquidity Score

```text
Semakin tinggi volume dan nilai transaksi, semakin tinggi score.

Range:

0-100
```

---

## Momentum Score

```text
Pertimbangkan:

EMA Cross

MACD

RSI

Higher High

Higher Low

Volume

Output

0-100
```

---

## Trend Score

```text
Strong Uptrend

Uptrend

Sideways

Downtrend

Strong Downtrend
```

---

## Volatility Score

```text
Gunakan ATR.

Cari volatilitas ideal.

Terlalu kecil = sulit profit.

Terlalu besar = risiko tinggi.
```

---

## Smart Money Score

```text
Estimasi akumulasi.

Pertimbangkan:

Volume meningkat

Close dekat High

Higher Low

Kenaikan bertahap

Value besar

Foreign Net Buy bila tersedia.
```

---

## Distribution Score

```text
Deteksi distribusi.

Misal:

Volume naik

Harga turun

Long Upper Shadow

3 Red Candle

Bearish Divergence

Output

0-100
```

---

## Fundamental Score

```text
Gunakan:

ROE

DER

PER

PBV

EPS

Market Cap

Output

0-100
```

---

# PROBABILITY ENGINE

AI harus menghasilkan probabilitas.

Contoh

```text
Swing 1-3 Hari

Take Profit

78%

Stop Loss

22%

Expected Return

4.8%

Expected Drawdown

1.7%

Confidence

89%
```

---

Contoh kedua

```text
Scalping Besok

Gap Up

71%

Opening Strength

81%

Momentum Lanjutan

76%

False Breakout

24%

Confidence

86%
```

---

# RULE ENGINE

AI harus menggunakan kombinasi rule.

Contoh:

```text
IF

Close > EMA20

AND

EMA9 > EMA20

AND

RSI 55-70

AND

Volume > 2x MA20

AND

ATR meningkat

AND

Higher High

THEN

Momentum Score +15

Trend Score +10

Swing Probability +12%

Scalping Probability +8%
```

---

Contoh

```text
IF

Long Upper Shadow

AND

Volume Besar

AND

Close dekat Low

THEN

Distribution +20

False Breakout +25%

Stop Loss Probability +15%
```

---

# CONFIDENCE SCORE

Confidence Score dihitung berdasarkan:

```text
Jumlah indikator yang saling mendukung.

Semakin banyak indikator searah

Semakin tinggi confidence.
```

---

# EXPLANATION ENGINE

AI WAJIB menjelaskan alasannya.

Contoh

```text
BUY

Confidence

91%

Alasan:

Trend Up

EMA20 ditembus

MACD Golden Cross

Volume 2.8x rata-rata

RSI masih sehat

Tidak ada pola distribusi

Risk Reward 1 : 2.6
```

---

# BACKTEST ENGINE

AI harus dapat melakukan backtest.

Misalnya:

```text
Tanggal

5 Januari 2025

AI memilih

15 saham

Holding

3 hari
```

Output

```text
Menang

11

Kalah

4

Win Rate

73%

Average Return

4.2%

Average Loss

1.8%

Profit Factor

2.31

Expectancy

2.5%
```

---

# SELF LEARNING

```text
AI harus dapat mengevaluasi histori.

Jika suatu indikator terbukti meningkatkan win rate,

otomatis bobot indikator dinaikkan.

Jika suatu indikator sering menghasilkan loss,

otomatis bobotnya diturunkan.

Bobot harus dapat berubah berdasarkan hasil backtest.

AI harus menyimpan histori performa model.
```

---

# OUTPUT JSON

```json
{
  "stock": "BBCA",
  "strategy": "Swing Trade",
  "recommendation": "BUY",
  "confidence": 91,
  "swing_probability": {
    "take_profit": 78,
    "stop_loss": 22,
    "expected_return": 4.8,
    "expected_drawdown": 1.7
  },
  "scalping_probability": {
    "gap_up": 71,
    "opening_strength": 81,
    "momentum_continuation": 76,
    "false_breakout": 24
  },
  "scores": {
    "liquidity": 88,
    "momentum": 92,
    "trend": 90,
    "volatility": 74,
    "smart_money": 81,
    "distribution": 18,
    "fundamental": 85
  },
  "entry": 9450,
  "stop_loss": 9250,
  "take_profit": [
    9700,
    9900
  ],
  "risk_reward": "1:2.4",
  "explanation": [
    "EMA9 berada di atas EMA20",
    "MACD Golden Cross",
    "Volume 2.5x rata-rata 20 hari",
    "RSI 61",
    "Breakout resistance",
    "Tidak ada sinyal distribusi"
  ]
}
```

## Pengembangan yang saya rekomendasikan

Saya menyarankan agar **tidak menggunakan angka probabilitas statis** seperti "TP 78%" yang hanya berasal dari aturan (rule). Sebaliknya, bangun **Probability Engine berbasis data historis**:

1. Simpan data EOD minimal **5–10 tahun** untuk seluruh saham BEI.
2. Setiap hari, hitung semua fitur teknikal dan fundamental.
3. Beri label hasil aktual:

   * Dalam 3 hari berikutnya, apakah target +3% tercapai sebelum stop loss -2%?
   * Dalam 1 hari berikutnya, apakah terjadi gap up >1%?
4. Latih model klasifikasi (misalnya XGBoost atau LightGBM) untuk mempelajari pola yang benar-benar menghasilkan TP atau SL.
5. Gunakan output model sebagai probabilitas. Dengan demikian, angka seperti **"Take Profit 78%"** benar-benar berarti bahwa pada data historis, setup serupa berhasil sekitar 78% dari waktu, bukan sekadar estimasi berdasarkan aturan. Ini akan membuat aplikasi Anda jauh lebih kredibel dan terus meningkat akurasinya seiring bertambahnya data.
