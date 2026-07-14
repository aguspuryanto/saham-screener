import axios from 'axios';
import { TradeJournalEntry } from '../../domain/models/TradeJournal';

export async function fetchJournalEntries(): Promise<TradeJournalEntry[]> {
  try {
    const response = await axios.get('/api/journal');
    return response.data?.entries ?? [];
  } catch (error) {
    console.error('Failed to fetch trade journal', error);
    return [];
  }
}

export async function createJournalEntry(entry: TradeJournalEntry): Promise<TradeJournalEntry | null> {
  try {
    const response = await axios.post('/api/journal', entry);
    return response.data?.entry ?? null;
  } catch (error) {
    console.error('Failed to save trade journal entry', error);
    return null;
  }
}
