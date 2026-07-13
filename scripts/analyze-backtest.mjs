/**
 * Aggregates scripts/output/backtest-raw.json into summary statistics,
 * bucket breakdowns, and a feature-importance correlation analysis.
 *
 * Run: node scripts/analyze-backtest.mjs
 */
import fs from 'fs';
import path from 'path';

const RAW_PATH = path.join(process.cwd(), 'scripts', 'output', 'backtest-raw.json');
const OUT_PATH = path.join(process.cwd(), 'scripts', 'output', 'backtest-summary.json');
const WIN_TP = 5; // must match WIN_THRESHOLD_PCT in backtest-momentum-score.ts

const rows = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN;
}
function std(arr) {
  if (arr.length < 2) return NaN;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
}
function median(arr) {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function pearson(x, y) {
  const n = x.length;
  if (n !== y.length || n < 2) return NaN;
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? NaN : num / denom;
}

// Realized P&L simulation: take-profit at +5% if intraday high touches it, else exit at close.
function pnl(row) {
  return row.win ? WIN_TP : row.ret_o2c_1d;
}

function tradeStats(subset) {
  const n = subset.length;
  const pnls = subset.map(pnl);
  const wins = subset.filter((r) => r.win);
  const losses = subset.filter((r) => !r.win);
  const grossProfit = pnls.filter((p) => p > 0).reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(pnls.filter((p) => p < 0).reduce((a, b) => a + b, 0));
  const rets = subset.map((r) => r.ret_o2c_1d);
  const mfes = subset.map((r) => r.mfe_1d);
  const maes = subset.map((r) => r.mae_1d);

  return {
    n,
    wins: wins.length,
    losses: losses.length,
    winRate: n ? (wins.length / n) * 100 : NaN,
    avgProfit: mean(pnls.filter((p) => p > 0)),
    avgLoss: mean(pnls.filter((p) => p < 0)),
    profitFactor: grossLoss === 0 ? Infinity : grossProfit / grossLoss,
    expectancy: mean(pnls),
    avgReturnClose: mean(rets),
    medianReturnClose: median(rets),
    avgMfe: mean(mfes),
    avgMae: mean(maes),
  };
}

function equityCurveMaxDrawdown(subset) {
  const sorted = [...subset].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  let cum = 0, peak = 0, maxDD = 0;
  for (const r of sorted) {
    cum += pnl(r);
    peak = Math.max(peak, cum);
    maxDD = Math.min(maxDD, cum - peak);
  }
  return { finalCumPct: cum, maxDrawdownPct: maxDD };
}

function bucketBy(rows, bucketFn) {
  const groups = {};
  for (const r of rows) {
    const key = bucketFn(r);
    if (key === null) continue;
    (groups[key] ??= []).push(r);
  }
  const result = {};
  for (const [key, subset] of Object.entries(groups)) {
    result[key] = tradeStats(subset);
  }
  return result;
}

// ---- Overall ----
const overall = tradeStats(rows);
const overallDD = equityCurveMaxDrawdown(rows);
const overallPnls = rows.map(pnl);
overall.sharpeUnannualized = mean(overallPnls) / std(overallPnls);
overall.maxDrawdownPct = overallDD.maxDrawdownPct;
overall.finalCumPct = overallDD.finalCumPct;

// Holding period comparison (only rows where the horizon exists)
function holdingStats(field) {
  const subset = rows.filter((r) => r[field] !== null && r[field] !== undefined);
  return { n: subset.length, avgReturn: mean(subset.map((r) => r[field])) };
}
const holding = {
  h1: holdingStats('ret_o2c_1d'),
  h3: holdingStats('ret_o2c_3d'),
  h5: holdingStats('ret_o2c_5d'),
};

// ---- Momentum Score bucket ----
function momentumBucketKey(r) {
  if (r.momentumScore >= 90) return '90-100';
  if (r.momentumScore >= 80) return '80-89';
  if (r.momentumScore >= 70) return '70-79';
  if (r.momentumScore >= 60) return '60-69';
  return '<60';
}
const momentumBucket = bucketBy(rows, momentumBucketKey);

// Momentum Score bucket vs. avg return at 3d/5d horizons (does the score help more at swing horizon?)
function momentumBucketAvgReturn(field) {
  const groups = {};
  for (const r of rows) {
    if (r[field] === null || r[field] === undefined) continue;
    const key = momentumBucketKey(r);
    (groups[key] ??= []).push(r[field]);
  }
  const out = {};
  for (const [k, v] of Object.entries(groups)) out[k] = { n: v.length, avgReturn: mean(v) };
  return out;
}
const momentumBucketReturn3d = momentumBucketAvgReturn('ret_o2c_3d');
const momentumBucketReturn5d = momentumBucketAvgReturn('ret_o2c_5d');

// ---- Sector ----
const hasSector = rows.some((r) => r.sector);
const sectorBucket = hasSector ? bucketBy(rows, (r) => r.sector) : null;

// ---- Relative Volume ----
const rvolBucket = bucketBy(rows, (r) => {
  if (r.relativeVolume > 5) return '>5x';
  if (r.relativeVolume > 3) return '3-5x';
  if (r.relativeVolume > 2) return '2-3x';
  return '<2x';
});

// ---- Value (transaction value proxy) ----
const B = 1_000_000_000;
const valueBucket = bucketBy(rows, (r) => {
  if (r.value < 10 * B) return '<10B';
  if (r.value < 20 * B) return '10-20B';
  if (r.value < 50 * B) return '20-50B';
  if (r.value < 100 * B) return '50-100B';
  return '>100B';
});

// ---- RSI bands (spec section 6: focus on high-RSI zones) ----
const rsiHighBucket = bucketBy(rows, (r) => {
  if (r.rsi14 >= 60 && r.rsi14 < 70) return '60-70';
  if (r.rsi14 >= 70 && r.rsi14 < 80) return '70-80';
  if (r.rsi14 >= 80 && r.rsi14 < 90) return '80-90';
  if (r.rsi14 >= 90) return '>90';
  return null; // below 60 excluded from this specific breakdown per spec
});
// General RSI breakdown (all ranges) for completeness
const rsiAllBucket = bucketBy(rows, (r) => {
  if (r.rsi14 < 30) return '<30 (oversold)';
  if (r.rsi14 < 50) return '30-50';
  if (r.rsi14 < 70) return '50-70';
  return '>=70 (overbought)';
});

// ---- EMA state ----
const emaBucket = bucketBy(rows, (r) => r.emaState);

// ---- MACD state ----
const macdBucket = bucketBy(rows, (r) => r.macdState);

// ---- Gap Open ----
const gapBucket = bucketBy(rows, (r) => {
  if (r.gapPct >= 5) return 'Gap Up >5%';
  if (r.gapPct >= 0.5) return 'Gap Up <5%';
  if (r.gapPct > -0.5) return 'Flat';
  return 'Gap Down';
});

// ---- False breakout ----
const falseBreakouts = rows.filter((r) => r.falseBreakout);
const falseBreakoutStats = {
  count: falseBreakouts.length,
  pctOfTotal: (falseBreakouts.length / rows.length) * 100,
  avgNextDayReturn: mean(falseBreakouts.map((r) => r.ret_o2c_1d)),
};

// ---- Feature Importance: correlation with outcome ----
const winAsNum = rows.map((r) => (r.win ? 1 : 0));
const retO2c = rows.map((r) => r.ret_o2c_1d);

const features = {
  momentumScore: rows.map((r) => r.momentumScore),
  rsi14: rows.map((r) => r.rsi14),
  macdHistogram: rows.map((r) => r.macdHistogram),
  emaSpreadPct: rows.map((r) => ((r.ema20 - r.ema50) / r.closeAtT) * 100),
  relativeVolume: rows.map((r) => r.relativeVolume),
  gapPct: rows.map((r) => r.gapPct),
  value: rows.map((r) => r.value),
  higherHigh: rows.map((r) => (r.higherHigh ? 1 : 0)),
  higherLow: rows.map((r) => (r.higherLow ? 1 : 0)),
};

const featureImportance = Object.entries(features)
  .map(([name, series]) => ({
    feature: name,
    corrWithReturn: pearson(series, retO2c),
    corrWithWin: pearson(series, winAsNum),
  }))
  .sort((a, b) => Math.abs(b.corrWithReturn) - Math.abs(a.corrWithReturn));

// Same features vs. 3-day / 5-day holding returns (subset where horizon exists)
function featureImportanceForHorizon(field) {
  const subset = rows.filter((r) => r[field] !== null && r[field] !== undefined);
  const target = subset.map((r) => r[field]);
  return Object.keys(features)
    .map((name) => {
      const series = subset.map((r) => {
        if (name === 'emaSpreadPct') return ((r.ema20 - r.ema50) / r.closeAtT) * 100;
        if (name === 'higherHigh') return r.higherHigh ? 1 : 0;
        if (name === 'higherLow') return r.higherLow ? 1 : 0;
        return r[name];
      });
      return { feature: name, corrWithReturn: pearson(series, target) };
    })
    .sort((a, b) => Math.abs(b.corrWithReturn) - Math.abs(a.corrWithReturn));
}
const featureImportance3d = featureImportanceForHorizon('ret_o2c_3d');
const featureImportance5d = featureImportanceForHorizon('ret_o2c_5d');

// Pairwise correlation matrix among features (for redundancy detection)
const featureNames = Object.keys(features);
const correlationMatrix = {};
for (const a of featureNames) {
  correlationMatrix[a] = {};
  for (const b of featureNames) {
    correlationMatrix[a][b] = pearson(features[a], features[b]);
  }
}

const redundantPairs = [];
for (let i = 0; i < featureNames.length; i++) {
  for (let j = i + 1; j < featureNames.length; j++) {
    const a = featureNames[i], b = featureNames[j];
    const c = correlationMatrix[a][b];
    if (Math.abs(c) > 0.7) redundantPairs.push({ a, b, corr: c });
  }
}
redundantPairs.sort((x, y) => Math.abs(y.corr) - Math.abs(x.corr));

const summary = {
  meta: {
    nObservations: rows.length,
    tickers: [...new Set(rows.map((r) => r.ticker))].length,
    dateRange: [rows.reduce((min, r) => (r.date < min ? r.date : min), rows[0].date),
                rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date)],
    winDefinition: `High(t+1) >= Open(t+1) * (1 + ${WIN_TP}/100)`,
    pnlSimulation: `take-profit at +${WIN_TP}% if intraday high touches it, else exit at close of entry day`,
    sectorMapAvailable: hasSector,
  },
  overall,
  holding,
  momentumBucket,
  sectorBucket,
  rvolBucket,
  valueBucket,
  rsiHighBucket,
  rsiAllBucket,
  emaBucket,
  macdBucket,
  gapBucket,
  falseBreakoutStats,
  featureImportance,
  featureImportance3d,
  featureImportance5d,
  momentumBucketReturn3d,
  momentumBucketReturn5d,
  correlationMatrix,
  redundantPairs,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2));
console.log(`Wrote summary to ${OUT_PATH}`);
console.log('\n--- Overall ---');
console.log(overall);
console.log('\n--- Feature Importance (|corr with return| desc) ---');
console.table(featureImportance.map(f => ({
  feature: f.feature,
  corrWithReturn: f.corrWithReturn.toFixed(4),
  corrWithWin: f.corrWithWin.toFixed(4),
})));
console.log('\n--- Redundant pairs (|corr| > 0.7) ---');
console.table(redundantPairs);
