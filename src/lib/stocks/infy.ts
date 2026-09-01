// ============================================================
// Stock Dataset: INFY (Infosys Limited)
// Enterprise Digital Transformation & Software Services
// ============================================================
import { StockDataset, MarketData, SyntheticNews, SEBIFiling } from '../types';

export const infyDataset: StockDataset = {
  meta: {
    ticker: 'INFY',
    name: 'Infosys Limited',
    sector: 'Digital Services & Consulting',
    exchange: 'NSE',
    currentPrice: 1884.50,
    priceChangePct: 1.5,
    peRatio: 26.8,
    marketCap: '₹7.82T',
    portfolioAllocation: 4.1,
    sparklineHigh: 1950.00,
    sparklineLow: 1710.00,
    volume24h: '5.8M',
  },

  generateMarketData: (shocked = false): MarketData => {
    const base = 1750;
    const prices: number[] = [];
    let p = base;
    for (let i = 0; i < 90; i++) {
      const drift = shocked ? -0.003 : 0.0012;
      const vol = shocked ? 0.03 : 0.016;
      p = p * (1 + drift + Math.sin(i * 0.14) * vol);
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
      const rsiBase = shocked ? 40 : 54;
      rsi.push(Math.round(Math.max(15, Math.min(85, rsiBase + Math.cos(i * 0.11) * 14))));
    }
    const volume: number[] = [];
    for (let i = 0; i < 90; i++) {
      const volBase = shocked ? 9_000_000 : 5_500_000;
      volume.push(Math.round(volBase * (0.8 + Math.random() * 0.4)));
    }

    return {
      prices,
      dates,
      rsi,
      volume,
      pe: shocked ? 30.2 : 26.8,
      revenueGrowth: shocked ? 0.03 : 0.082,
      roe: shocked ? 0.26 : 0.31,
      earningsGrowth: shocked ? 0.015 : 0.076,
      momentum: shocked ? -0.03 : 0.022,
      volumeAnomaly: shocked,
    };
  },

  generateNews: (shocked = false): SyntheticNews[] => {
    if (shocked) {
      return [
        { headline: 'Infosys faces regulatory scrutiny in Europe regarding cross-border data transfer protocols', source: 'Reuters', sentiment: -0.65, date: '2026-08-30', eventSignal: 'REGULATORY_RISK' },
        { headline: 'Attrition rates creep up 120 bps in mid-tier software engineering roles', source: 'Mint', sentiment: -0.4, date: '2026-08-27', eventSignal: 'TALENT_RISK' },
      ];
    }
    return [
      { headline: 'Infosys Cobalt Generative AI platform suite expanded across 150 enterprise customers', source: 'Economic Times', sentiment: 0.8, date: '2026-08-30', eventSignal: 'AI_CATALYST' },
      { headline: 'Infosys raises FY27 revenue guidance to 6%-8% YoY on strong enterprise deal pipeline', source: 'Business Standard', sentiment: 0.72, date: '2026-08-28', eventSignal: 'GUIDANCE_HIKE' },
    ];
  },

  retrieveRelevantFilings: (_query: string): SEBIFiling[] => {
    return [
      {
        id: 'SEBI-INFY-2026-Q2-01',
        source: 'SEBI Quarterly Financial & Guidance Disclosure',
        chunk: 'Infosys revenues grew 7.1% YoY in constant currency to ₹41,870 Cr. Operating margin stood firm at 21.1%. Large deal TCV signed stood at $3.4B with 55% net new contract originations.',
        date: '2026-07-20',
        category: 'FINANCIAL_RESULTS',
      },
    ];
  },
};
