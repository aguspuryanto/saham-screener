import axios from 'axios';
import { HistoryResponse } from '../../domain/models/History';

export async function fetchStockHistory(code: string, range = '2y'): Promise<HistoryResponse> {
  try {
    const response = await axios.get(`/api/stocks/${code}/history`, {
      params: { range },
    });
    return response.data;
  } catch (error) {
    return {
      code,
      ok: false,
      bars: [],
      reason: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
