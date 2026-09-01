// ============================================================
// Stock Dataset: TCS (Tata Consultancy Services Limited)
// IT Services & Cloud/AI Solutions
// ============================================================
import { StockDataset, MarketData, SyntheticNews, SEBIFiling } from '../types';

export const tcsDataset: StockDataset = {
  meta: {
    ticker: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    sector: 'IT Services & AI Consulting',
    exchange: 'NSE',
    currentPrice: 4150.80,
    priceChangePct: 0.8,
    peRatio: 31.4,
    marketCap: '₹15.02T',
    portfolioAllocation: 5.2,
    sparklineHigh: 4280.00,
    sparklineLow: 3850.00,
    volume24h: '3.1M',
  },

  generateMarketData: (shocked = false): MarketData => {
    const base = 3900;
    const prices: number[] = [];
    let p = base;
    for (let i = 0; i < 90; i++) {
      const drift = shocked ? -0.0025 : 0.0008;
      const vol = shocked ? 0.028 : 0.014;
      p = p * (1 + drift + Math.cos(i * 0.1) * vol + (i % 5 === 0 ? 1 : -1) * vol * 0.2);
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
      const rsiBase = shocked ? 42 : 58;
      rsi.push(Math.round(Math.max(20, Math.min(80, rsiBase + Math.sin(i * 0.1) * 12))));
    }
    const volume: number[] = [];
    for (let i = 0; i < 90; i++) {
      const volBase = shocked ? 5_000_000 : 3_000_000;
      volume.push(Math.round(volBase * (0.85 + Math.random() * 0.3)));
    }

    return {
      prices,
      dates,
      rsi,
      volume,
      pe: shocked ? 35.1 : 31.4,
      revenueGrowth: shocked ? 0.04 : 0.095,
      roe: shocked ? 0.38 : 0.44,
      earningsGrowth: shocked ? 0.02 : 0.088,
      momentum: shocked ? -0.02 : 0.018,
      volumeAnomaly: shocked,
    };
  },

  generateNews: (shocked = false): SyntheticNews[] => {
    if (shocked) {
      return [
        { headline: 'Gartner survey indicates US banking clients pushing back on IT discretionary spend renewals', source: 'Bloomberg', sentiment: -0.7, date: '2026-08-30', eventSignal: 'MACRO_RISK' },
        { headline: 'Senior leadership departure in North American AI business unit raises integration concerns', source: 'Economic Times', sentiment: -0.55, date: '2026-08-28', eventSignal: 'EXEC_TURNOVER' },
      ];
    }
    return [
      { headline: 'TCS secures major $1.2B multi-year cloud transformation contract with European banking giant', source: 'Economic Times', sentiment: 0.85, date: '2026-08-30', eventSignal: 'DEAL_WIN' },
      { headline: 'TCS AI Cloud practice reports 40% QoQ order book expansion with enterprise clients', source: 'Reuters', sentiment: 0.75, date: '2026-08-28', eventSignal: 'GROWTH_CATALYST' },
    ];
  },

  retrieveRelevantFilings: (_query: string): SEBIFiling[] => {
    return [
      {
        id: 'SEBI-TCS-2026-Q2-01',
        source: 'SEBI Quarterly Audited Financial Statement',
        chunk: 'TCS consolidated revenue grew 8.8% YoY to ₹62,630 Cr with EBIT operating margins expanding 40 bps to 24.6%. Total Contract Value (TCV) signed during the quarter reached $10.2B, supported by double-digit growth in Cloud Transformation and Cyber Security services.',
        date: '2026-07-18',
        category: 'FINANCIAL_RESULTS',
      },
    ];
  },
};
