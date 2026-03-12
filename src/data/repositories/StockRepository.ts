import { Stock } from '../../domain/models/Stock';
import axios from 'axios';

export interface StockRepository {
  getStocks(): Promise<Stock[]>;
  getStockById(id: string): Promise<Stock | undefined>;
}

export class ApiStockRepository implements StockRepository {
  async getStocks(): Promise<Stock[]> {
    try {
      const response = await axios.get('/api/stocks');
      const data = response.data;
      
      return data.map((item: any) => {
        const per = item.Per || 0;
        const last = item.Last || 0;
        const eps = per !== 0 ? last / per : 0;
        
        // Mocking some data that the API doesn't provide
        const rsi14 = Math.floor(Math.random() * 60) + 20;
        const macd = Math.random() * 10 - 5;
        const macdSignal = Math.random() * 10 - 5;
        const ema20 = last * (1 + (Math.random() * 0.1 - 0.05));
        const ema50 = last * (1 + (Math.random() * 0.2 - 0.1));
        const pbv = item.Pbr || 0;
        
        // Determine recommendation based on simple logic
        let recommendation: Stock['recommendation'] = 'HOLD';
        if (pbv < 1 && per > 0 && per < 15) recommendation = 'BUY';
        else if (pbv > 3 || per > 30) recommendation = 'SELL';
        else if (pbv < 1.5) recommendation = 'ACCUMULATE';
        
        return {
          id: item.Code,
          ticker: item.Code,
          name: item.Name,
          sector: item.SectorName || 'Unknown',
          lastClose: last,
          percentChange: (item.OneDay || 0) * 100,
          lastUpdated: new Date(item.LastUpdate).toLocaleString(),
          recommendation,
          strategy: rsi14 < 30 ? 'Reversal' : rsi14 > 70 ? 'Momentum' : 'Consolidation',
          technical: {
            rsi14,
            rsi12: rsi14 - 2,
            macd,
            macdSignal,
            ema20,
            ema50,
            volRatio: Number((Math.random() * 3).toFixed(2)),
          },
          fundamental: {
            pbv: Number(pbv.toFixed(2)),
            per: Number(per.toFixed(2)),
            eps: Number(eps.toFixed(2)),
            dy: Number((Math.random() * 5).toFixed(2)), // Mocked Dividend Yield
            roe: Number(((item.Roe || 0) * 100).toFixed(2)),
          },
          dcf: {
            intrinsicValue: Number((last * (1 + (Math.random() * 0.4 - 0.1))).toFixed(0)),
            status: pbv < 1 ? 'Undervalued' : pbv > 2 ? 'Overvalued' : 'Fair Value',
          },
          consensus: {
            rating: recommendation === 'BUY' ? 'Strong Buy' : recommendation === 'SELL' ? 'Sell' : 'Hold',
            analystsCount: Math.floor(Math.random() * 30) + 5,
            averageRating: Number((Math.random() * 5).toFixed(1)),
          }
        } as Stock;
      });
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
