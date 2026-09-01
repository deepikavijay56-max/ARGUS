// ============================================================
// ARGUS — Synthetic Data Generation
// ============================================================
import {
  MarketData,
  SyntheticNews,
  SEBIFiling,
  InvestorProfile,
  RiskProfile,
  PortfolioContext,
  TickerSymbol,
} from './types';

// --- Investor Profiles ---
export const INVESTOR_PROFILES: Record<RiskProfile, InvestorProfile> = {
  CONSERVATIVE: {
    id: 'CONSERVATIVE',
    label: 'Conservative',
    riskTolerance: 0.2,
    investmentHorizon: '5–10 years',
    lossTolerance: 0.05,
    goal: 'Capital preservation with modest income generation',
  },
  MODERATE: {
    id: 'MODERATE',
    label: 'Moderate',
    riskTolerance: 0.5,
    investmentHorizon: '3–5 years',
    lossTolerance: 0.15,
    goal: 'Balanced growth with controlled downside risk',
  },
  AGGRESSIVE: {
    id: 'AGGRESSIVE',
    label: 'Aggressive',
    riskTolerance: 0.85,
    investmentHorizon: '1–3 years',
    lossTolerance: 0.30,
    goal: 'Maximum capital appreciation with high risk tolerance',
  },
};

// --- Price Data ---
function generatePriceSeries(shocked: boolean): number[] {
  const base = 2450;
  const prices: number[] = [];
  let p = base;
  for (let i = 0; i < 90; i++) {
    const drift = shocked ? -0.003 : 0.001;
    const vol = shocked ? 0.035 : 0.018;
    p = p * (1 + drift + (Math.sin(i * 0.15) * vol) + ((i % 7 === 0 ? -1 : 1) * vol * 0.3));
    prices.push(Math.round(p * 100) / 100);
  }
  return prices;
}

function generateDates(): string[] {
  const dates: string[] = [];
  const start = new Date('2026-06-01');
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function generateRSI(shocked: boolean): number[] {
  const rsi: number[] = [];
  for (let i = 0; i < 90; i++) {
    const base = shocked ? 38 : 55;
    const oscillation = Math.sin(i * 0.12) * 15 + (Math.cos(i * 0.07) * 8);
    rsi.push(Math.round(Math.max(15, Math.min(85, base + oscillation))));
  }
  return rsi;
}

function generateVolume(shocked: boolean): number[] {
  const vol: number[] = [];
  for (let i = 0; i < 90; i++) {
    const base = shocked ? 18_000_000 : 12_000_000;
    const spike = i % 15 === 0 ? 2.5 : 1;
    vol.push(Math.round(base * spike * (0.8 + Math.random() * 0.4)));
  }
  return vol;
}

import { getStockDataset } from './stocks';

export function generateMarketData(shocked = false, ticker: TickerSymbol = 'RELIANCE'): MarketData {
  return getStockDataset(ticker).generateMarketData(shocked);
}

export function generateNews(shocked = false, ticker: TickerSymbol = 'RELIANCE'): SyntheticNews[] {
  return getStockDataset(ticker).generateNews(shocked);
}

export function retrieveRelevantFilings(query: string, ticker: TickerSymbol = 'RELIANCE'): SEBIFiling[] {
  return getStockDataset(ticker).retrieveRelevantFilings(query);
}

// --- Portfolio Context ---
export const SAMPLE_PORTFOLIO: PortfolioContext = {
  totalValue: 25_00_000, // ₹25L
  relianceAllocation: 8.4,
  holdings: [
    { name: 'RELIANCE', allocation: 8.4 },
    { name: 'HDFC BANK', allocation: 12.1 },
    { name: 'INFOSYS', allocation: 9.8 },
    { name: 'TCS', allocation: 7.2 },
    { name: 'ICICI BANK', allocation: 6.5 },
    { name: 'NIFTY 50 INDEX FUND', allocation: 28.0 },
    { name: 'DEBT MUTUAL FUNDS', allocation: 18.0 },
    { name: 'GOLD ETF', allocation: 5.5 },
    { name: 'CASH', allocation: 4.5 },
  ],
};
