// ============================================================
// Stock Dataset: RELIANCE (Reliance Industries Limited)
// Full rich synthetic data for primary demo stock
// ============================================================
import { StockDataset, MarketData, SyntheticNews, SEBIFiling } from '../types';

export const relianceDataset: StockDataset = {
  meta: {
    ticker: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    sector: 'Energy & Telecom Conglomerate',
    exchange: 'NSE',
    currentPrice: 2954.20,
    priceChangePct: 1.2,
    peRatio: 28.7,
    marketCap: '₹19.98T',
    portfolioAllocation: 8.4,
    sparklineHigh: 3020.00,
    sparklineLow: 2420.00,
    volume24h: '8.4M',
  },

  generateMarketData: (shocked = false): MarketData => {
    const base = 2450;
    const prices: number[] = [];
    let p = base;
    for (let i = 0; i < 90; i++) {
      const drift = shocked ? -0.003 : 0.001;
      const vol = shocked ? 0.035 : 0.018;
      p = p * (1 + drift + Math.sin(i * 0.15) * vol + (i % 7 === 0 ? -1 : 1) * vol * 0.3);
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
      const rsiBase = shocked ? 38 : 55;
      const oscillation = Math.sin(i * 0.12) * 15 + Math.cos(i * 0.07) * 8;
      rsi.push(Math.round(Math.max(15, Math.min(85, rsiBase + oscillation))));
    }
    const volume: number[] = [];
    for (let i = 0; i < 90; i++) {
      const volBase = shocked ? 18_000_000 : 12_000_000;
      const spike = i % 15 === 0 ? 2.5 : 1;
      volume.push(Math.round(volBase * spike * (0.8 + Math.random() * 0.4)));
    }

    return {
      prices,
      dates,
      rsi,
      volume,
      pe: shocked ? 34.2 : 28.7,
      revenueGrowth: shocked ? 0.06 : 0.14,
      roe: shocked ? 0.09 : 0.127,
      earningsGrowth: shocked ? 0.03 : 0.11,
      momentum: shocked ? -0.04 : 0.025,
      volumeAnomaly: shocked ? true : false,
    };
  },

  generateNews: (shocked = false): SyntheticNews[] => {
    if (shocked) {
      return [
        { headline: 'SEBI initiates audit into offshore holding structures linked to RELIANCE energy subsidiaries', source: 'Economic Times', sentiment: -0.85, date: '2026-08-30', eventSignal: 'REGULATORY_RISK' },
        { headline: 'Global crude margin compression threatens Q3 refining EBITDA for major Indian conglomerates', source: 'Reuters', sentiment: -0.65, date: '2026-08-29', eventSignal: 'MACRO_RISK' },
        { headline: 'Jio 5G ARPU expansion slows as low-tier subscriber churn accelerates', source: 'Mint', sentiment: -0.45, date: '2026-08-28', eventSignal: 'EARNINGS_MISS' },
        { headline: 'Promoter group increases collateralized share pledges by ₹3,200 Cr across non-operating entities', source: 'Business Standard', sentiment: -0.75, date: '2026-08-27', eventSignal: 'GOVERNANCE_RISK' },
      ];
    }
    return [
      { headline: 'Reliance Retail EBITDA jumps 23% YoY; digital commerce revenues touch record highs', source: 'Economic Times', sentiment: 0.8, date: '2026-08-30', eventSignal: 'GROWTH_CATALYST' },
      { headline: 'Jio Financial Services announces strategic JV for wealth management technology', source: 'Reuters', sentiment: 0.65, date: '2026-08-29', eventSignal: 'STRATEGIC_EXPANSION' },
      { headline: 'O2C segment margins remain resilient despite global refining volatility', source: 'Mint', sentiment: 0.4, date: '2026-08-28', eventSignal: 'MARGIN_RESILIENCE' },
      { headline: 'Green Energy giga-complex commissioning on track for Q4 operational launch', source: 'Business Standard', sentiment: 0.75, date: '2026-08-27', eventSignal: 'CAPEX_PROGRESS' },
    ];
  },

  retrieveRelevantFilings: (_query: string): SEBIFiling[] => {
    return [
      {
        id: 'SEBI-RIL-2026-Q2-01',
        source: 'SEBI Annual Compliance & Quarterly Disclosure',
        chunk: 'Consolidated revenue from operations stood at ₹2,48,120 Cr (+11.4% YoY). Digital Services segment revenue increased 14.2% driven by 5G subscriber additions. O2C segment EBITDA margin expanded 80 bps to 12.1%. Debt-to-Equity ratio remains stable at 0.38x with net financial debt at ₹1,12,400 Cr.',
        date: '2026-07-25',
        category: 'FINANCIAL_RESULTS',
      },
      {
        id: 'SEBI-RIL-2026-Q2-02',
        source: 'SEBI Related Party Transaction Filing',
        chunk: 'The Board has approved financial guarantees amounting to ₹8,500 Cr in favor of Reliance New Energy Limited for the construction of solar PV cell manufacturing facilities. All transactions have been conducted at arms-length with Audit Committee approval.',
        date: '2026-08-10',
        category: 'GOVERNANCE',
      },
      {
        id: 'SEBI-RIL-2026-Q2-03',
        source: 'SEBI Shareholding & Encumbrance Filing',
        chunk: 'Total promoter group shareholding stands at 50.41%. Pledged shares account for 1.12% of total promoter holding (0.56% of total equity), well within prescribed regulatory thresholds.',
        date: '2026-08-18',
        category: 'SHAREHOLDING',
      },
    ];
  },
};
