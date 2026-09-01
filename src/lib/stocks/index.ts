// ============================================================
// Stock Registry Index
// Central registry mapping TickerSymbols to StockDatasets
// ============================================================
import { StockDataset, TickerSymbol, StockMetadata } from '../types';
import { relianceDataset } from './reliance';
import { tcsDataset } from './tcs';
import { infyDataset } from './infy';
import { hdfcbankDataset } from './hdfcbank';

export const STOCKS_REGISTRY: Record<TickerSymbol, StockDataset> = {
  RELIANCE: relianceDataset,
  TCS: tcsDataset,
  INFY: infyDataset,
  HDFCBANK: hdfcbankDataset,
};

export const AVAILABLE_STOCKS: StockMetadata[] = [
  relianceDataset.meta,
  tcsDataset.meta,
  infyDataset.meta,
  hdfcbankDataset.meta,
];

export function getStockDataset(ticker: TickerSymbol = 'RELIANCE'): StockDataset {
  return STOCKS_REGISTRY[ticker] || relianceDataset;
}
