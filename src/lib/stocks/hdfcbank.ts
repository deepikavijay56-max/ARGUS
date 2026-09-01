// ============================================================
// Stock Dataset: HDFCBANK (HDFC Bank Limited)
// Banking & Financial Services
// ============================================================
import { StockDataset, MarketData, SyntheticNews, SEBIFiling } from '../types';

export const hdfcbankDataset: StockDataset = {
  meta: {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    sector: 'Private Banking & Financial Services',
    exchange: 'NSE',
    currentPrice: 1642.30,
    priceChangePct: -0.4,
    peRatio: 19.2,
    marketCap: '₹12.50T',
    portfolioAllocation: 6.8,
    sparklineHigh: 1720.00,
    sparklineLow: 1530.00,
    volume24h: '11.2M',
  },

  generateMarketData: (shocked = false): MarketData => {
    const base = 1580;
    const prices: number[] = [];
    let p = base;
    for (let i = 0; i < 90; i++) {
      const drift = shocked ? -0.004 : 0.0006;
      const vol = shocked ? 0.032 : 0.015;
      p = p * (1 + drift + Math.cos(i * 0.13) * vol);
      prices.push(Math.round(p * 100) / 100);
    }
    const dates: string[] = [];
    const start = new Date('2026-06-01');
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const rsi: number[] = [];
    for (let i = 0; i < 90; i++) {
      const rsiBase = shocked ? 35 : 51;
      rsi.push(Math.round(Math.max(15, Math.min(85, rsiBase + Math.sin(i * 0.1) * 16))));
    }
    const volume: number[] = [];
    for (let i = 0; i < 90; i++) {
      const volBase = shocked ? 16_000_000 : 10_000_000;
      volume.push(Math.round(volBase * (0.85 + Math.random() * 0.3)));
    }

    return {
      prices,
      dates,
      rsi,
      volume,
      pe: shocked ? 22.8 : 19.2,
      revenueGrowth: shocked ? 0.07 : 0.155,
      roe: shocked ? 0.12 : 0.162,
      earningsGrowth: shocked ? 0.04 : 0.138,
      momentum: shocked ? -0.035 : 0.012,
      volumeAnomaly: shocked,
    };
  },

  generateNews: (shocked = false): SyntheticNews[] => {
    if (shocked) {
      return [
        { headline: 'RBI tightens unsecured retail loan risk weights, pressuring tier-1 capital ratios', source: 'Economic Times', sentiment: -0.75, date: '2026-08-30', eventSignal: 'REGULATORY_RISK' },
        { headline: 'CASA ratio contracts 80 bps as high-yield deposit competition accelerates across private banks', source: 'Mint', sentiment: -0.55, date: '2026-08-28', eventSignal: 'DEPOSIT_PRESSURE' },
      ];
    }
    return [
      { headline: 'HDFC Bank Net Interest Margin (NIM) stabilizes at 3.65% with steady credit growth', source: 'Economic Times', sentiment: 0.75, date: '2026-08-30', eventSignal: 'MARGIN_STABILITY' },
      { headline: 'Gross NPA ratio improves to 1.24%; deposit mobilization accelerates across rural branches', source: 'Reuters', sentiment: 0.7, date: '2026-08-28', eventSignal: 'ASSET_QUALITY' },
    ];
  },

  retrieveRelevantFilings: (_query: string): SEBIFiling[] => {
    return [
      {
        id: 'SEBI-HDFCBANK-2026-Q2-01',
        source: 'SEBI Quarterly Financial Review',
        chunk: 'HDFC Bank Net Interest Income grew 15.2% YoY to ₹31,450 Cr. Net Profit stood at ₹16,820 Cr (+14.1% YoY). Gross NPA ratio stood at 1.24% vs 1.33% in prior quarter. Provision Coverage Ratio (PCR) maintained strong at 74.8%. Capital Adequacy Ratio (CRAR) comfortably above regulatory minimums at 19.3%.',
        date: '2026-07-22',
        category: 'FINANCIAL_RESULTS',
      },
    ];
  },
};
