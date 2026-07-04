import { Stock } from '../../domain/models/Stock';
import axios from 'axios';
import {
  computeSwingScore,
  computeScalpingScore,
  computeRecommendation,
  calcTradingLevels,
  estimateRSI,
  estimateEMARatio,
  estimateMACD,
  type RawApiStock,
} from '../../utils/scoringEngine';

export interface StockRepository {
  getStocks(): Promise<Stock[]>;
  getStockById(id: string): Promise<Stock | undefined>;
}

function mapApiItemToStock(item: RawApiStock): Stock {
  const last = item.Last || 0;
  const per = item.Per || 0;
  const pbr = item.Pbr || 0;
  const roe = item.Roe || 0;
  const eps = per !== 0 ? last / per : 0;

  const oneDay = item.OneDay || 0;
  const oneWeek = item.OneWeek || 0;
  const oneMonth = item.OneMonth || 0;
  const threeMonth = item.ThreeMonth || 0;

  const annualHigh = item.AdjustedAnnualHighPrice || last;
  const annualLow = item.AdjustedAnnualLowPrice || last * 0.7;
  const highToday = item.AdjustedHighPrice || last;
  const lowToday = item.AdjustedLowPrice || last;

  // S.C.A.N. Scores (data-driven, NOT random)
  const swingScore = computeSwingScore(item);
  const scalpingScore = computeScalpingScore(item);

  // Recommendation & Strategy
  const { rec: recommendation, strategy } = computeRecommendation(
    swingScore.totalScore,
    scalpingScore.totalScore,
    per,
    pbr,
    roe
  );

  // Technical indicators from real data
  const rsi14 = estimateRSI(oneDay, oneWeek, oneMonth, threeMonth);
  const { ema20, ema50, isGoldenCross } = estimateEMARatio(oneWeek, oneMonth, threeMonth);
  const { macd, signal: macdSignal } = estimateMACD(oneDay, oneWeek, oneMonth);

  // Volume ratio: use turnover vs capitalization as proxy
  const capitalization = item.Capitalization || 1;
  const value = item.Value || 0;
  const turnoverRatio = value / capitalization;
  const volRatio = parseFloat(Math.min(5, turnoverRatio / 0.001).toFixed(2));

  // Trading levels
  const swingLevels = calcTradingLevels(last, annualHigh, annualLow, highToday, lowToday, 'swing');
  const scalpingLevels = calcTradingLevels(last, annualHigh, annualLow, highToday, lowToday, 'scalping');

  // DCF: use PBV as primary signal, swing score as secondary
  const dcfStatus: 'Undervalued' | 'Fair Value' | 'Overvalued' =
    pbr > 0 && pbr < 1 ? 'Undervalued' :
    pbr > 3 ? 'Overvalued' :
    'Fair Value';

  // Consensus rating
  const consensusRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' =
    swingScore.totalScore >= 75 ? 'Strong Buy' :
    swingScore.totalScore >= 55 ? 'Buy' :
    swingScore.totalScore >= 35 ? 'Hold' :
    swingScore.totalScore >= 20 ? 'Sell' :
    'Strong Sell';

  const lastDate = item.LastDate || item.LastUpdate || new Date().toISOString();

  return {
    id: item.Code,
    ticker: item.Code,
    name: item.Name || item.Code,
    sector: item.SectorName || 'Unknown',
    subSector: item.SubSectorName || '',
    newSectorName: item.NewSectorName || item.SectorName || '',
    lastClose: last,
    prevClose: item.PrevClosingPrice || last,
    highToday,
    lowToday,
    percentChange: oneDay * 100,
    lastUpdated: new Date(lastDate).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    }),

    // Multi-period returns
    oneDay: oneDay * 100,
    oneWeek: oneWeek * 100,
    oneMonth: oneMonth * 100,
    threeMonth: threeMonth * 100,
    sixMonth: (item.SixMonth || 0) * 100,
    oneYear: (item.OneYear || 0) * 100,

    // Market data
    volume: item.Volume || 0,
    value: value,
    frequency: item.Frequency || 0,
    capitalization,

    // Annual range
    annualHigh,
    annualLow,

    // Risk metrics
    beta: item.BetaOneYear || 1,
    stdev: item.StdevOneYear || 0,
    freeFloatPct: item.FreeFloatPct || 0,

    // Technical indicators
    technical: {
      rsi14,
      rsi12: Math.max(10, rsi14 - 2),
      macd,
      macdSignal,
      ema20: last * ema20,
      ema50: last * ema50,
      volRatio,
    },

    // Fundamental
    fundamental: {
      pbv: parseFloat(pbr.toFixed(2)),
      per: parseFloat(per.toFixed(2)),
      eps: parseFloat(eps.toFixed(2)),
      dy: 0, // Not available in current API
      roe: parseFloat((roe * 100).toFixed(2)),
    },

    // DCF
    dcf: {
      intrinsicValue: parseFloat((last * (pbr > 0 ? 1 / pbr : 1)).toFixed(0)),
      status: dcfStatus,
    },

    // Consensus
    consensus: {
      rating: consensusRating,
      analystsCount: 0, // Not available in current API
      averageRating: swingScore.totalScore / 20, // 0-5 scale
    },

    recommendation,
    strategy,

    // S.C.A.N. Scores
    swingScore,
    scalpingScore,
    swingLevels,
    scalpingLevels,
  };
}

export class ApiStockRepository implements StockRepository {
  async getStocks(): Promise<Stock[]> {
    try {
      const response = await axios.get('http://localhost:3001/api/stocks');
      const data: RawApiStock[] = response.data;

      return data
        .filter((item) => item.Code && item.Last > 0) // Skip invalid entries
        .map(mapApiItemToStock);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      throw error;
    }
  }

  async getStockById(id: string): Promise<Stock | undefined> {
    const stocks = await this.getStocks();
    return stocks.find(s => s.id === id);
  }
}

export const stockRepository = new ApiStockRepository();
