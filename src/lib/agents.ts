// ============================================================
// ARGUS — Deterministic Agent Logic (Fallback / Primary)
// ============================================================
import {
  AgentOutput,
  AgentResult,
  AgentName,
  MarketData,
  SyntheticNews,
  SEBIFiling,
  RiskProfile,
  Signal,
  Claim,
  Evidence,
} from './types';
import { generateMarketData, generateNews, retrieveRelevantFilings } from './data';

// ---------------------------------------------------------------
// TECHNICAL AGENT
// ---------------------------------------------------------------
export function runTechnicalAgent(
  data: MarketData,
  _profile: RiskProfile,
  forceConflict = false
): AgentResult {
  const start = performance.now();

  if (forceConflict) {
    return {
      agent: 'TECHNICAL',
      output: {
        signal: 'BEARISH',
        confidence: 0.35,
        claims: [
          { text: 'Price series shows a bearish head-and-shoulders pattern with declining volume confirmation', type: 'INFERENCE', agent: 'TECHNICAL', confidence: 0.35 },
        ],
        evidence: [
          { source: 'Simulated: Price Data', chunk: 'Last 30-day decline of 8.2% with below-average volume', relevance: 0.7, retrievedText: 'Price series terminal value ₹' + data.prices[data.prices.length - 1].toFixed(2) },
        ],
        counterarguments: ['This contradicts fundamental strength — may be a false breakdown', 'RSI oversold conditions may trigger reversal'],
        uncertainty: 'AGENT CONFLICT: Technical reading contradicts fundamental data. Low confidence due to forced adversarial conditions.',
      },
      latencyMs: Math.round(performance.now() - start),
      status: 'DEGRADED',
      error: 'Injected data conflict — agent producing contrarian signal',
    };
  }

  const lastPrice = data.prices[data.prices.length - 1];
  const firstPrice = data.prices[0];
  const priceReturn = (lastPrice - firstPrice) / firstPrice;
  const currentRSI = data.rsi[data.rsi.length - 1];
  const avgVolume = data.volume.reduce((a, b) => a + b, 0) / data.volume.length;
  const lastVolume = data.volume[data.volume.length - 1];

  let signal: Signal = 'NEUTRAL';
  let confidence = 0.5;

  if (priceReturn > 0.03 && currentRSI > 45 && currentRSI < 70 && data.momentum > 0) {
    signal = 'BULLISH';
    confidence = 0.72;
  } else if (priceReturn < -0.03 || currentRSI > 75 || data.momentum < -0.02) {
    signal = 'BEARISH';
    confidence = 0.65;
  } else {
    signal = 'NEUTRAL';
    confidence = 0.55;
  }

  const claims: Claim[] = [
    {
      text: `Price has ${priceReturn > 0 ? 'appreciated' : 'declined'} ${(Math.abs(priceReturn) * 100).toFixed(1)}% over the 90-day period`,
      type: 'EVIDENCE',
      agent: 'TECHNICAL',
      confidence: 0.95,
    },
    {
      text: `RSI at ${currentRSI} suggests the stock is ${currentRSI > 70 ? 'overbought' : currentRSI < 30 ? 'oversold' : 'in neutral territory'}`,
      type: 'EVIDENCE',
      agent: 'TECHNICAL',
      confidence: 0.9,
    },
    {
      text: `Momentum indicator at ${(data.momentum * 100).toFixed(1)}% suggests ${data.momentum > 0 ? 'continued upward' : 'downward'} pressure`,
      type: 'INFERENCE',
      agent: 'TECHNICAL',
      confidence: confidence,
    },
    {
      text: data.volumeAnomaly
        ? 'Volume anomaly detected — potential institutional activity or forced selling'
        : 'Volume pattern is consistent with normal trading activity',
      type: data.volumeAnomaly ? 'EVIDENCE' : 'INFERENCE',
      agent: 'TECHNICAL',
      confidence: data.volumeAnomaly ? 0.85 : 0.6,
    },
  ];

  const evidence: Evidence[] = [
    {
      source: 'Simulated: 90-Day Price Series',
      chunk: `Open: ₹${firstPrice.toFixed(2)} → Close: ₹${lastPrice.toFixed(2)}`,
      relevance: 0.95,
      retrievedText: `90-day return: ${(priceReturn * 100).toFixed(2)}%`,
    },
    {
      source: 'Simulated: RSI Indicator',
      chunk: `Current RSI: ${currentRSI}`,
      relevance: 0.88,
      retrievedText: `RSI range over period: ${Math.min(...data.rsi)} – ${Math.max(...data.rsi)}`,
    },
    {
      source: 'Simulated: Volume Analysis',
      chunk: `Last volume: ${(lastVolume / 1_000_000).toFixed(1)}M vs avg ${(avgVolume / 1_000_000).toFixed(1)}M`,
      relevance: 0.75,
      retrievedText: `Volume ratio: ${(lastVolume / avgVolume).toFixed(2)}x average`,
    },
  ];

  return {
    agent: 'TECHNICAL',
    output: {
      signal,
      confidence,
      claims,
      evidence,
      counterarguments: [
        'Technical signals have historically low predictive power for large-cap Indian equities with high institutional ownership',
        'RSI-based signals may generate false readings during trending markets',
      ],
      uncertainty: `Technical analysis captures price dynamics but cannot account for fundamental catalysts. Current RSI of ${currentRSI} is within normal bounds, limiting conviction.`,
    },
    latencyMs: Math.round(performance.now() - start),
    status: 'SUCCESS',
  };
}

// ---------------------------------------------------------------
// FUNDAMENTAL AGENT
// ---------------------------------------------------------------
export function runFundamentalAgent(
  data: MarketData,
  _profile: RiskProfile
): AgentResult {
  const start = performance.now();

  let signal: Signal = 'NEUTRAL';
  let confidence = 0.5;

  const peRatio = data.pe;
  const revGrowth = data.revenueGrowth;
  const roe = data.roe;
  const earningsGrowth = data.earningsGrowth;

  if (revGrowth > 0.10 && roe > 0.10 && earningsGrowth > 0.08 && peRatio < 35) {
    signal = 'BULLISH';
    confidence = 0.76;
  } else if (revGrowth < 0.05 || roe < 0.08 || peRatio > 40) {
    signal = 'BEARISH';
    confidence = 0.62;
  } else {
    signal = 'NEUTRAL';
    confidence = 0.58;
  }

  const claims: Claim[] = [
    {
      text: `P/E ratio of ${peRatio.toFixed(1)}x is ${peRatio > 30 ? 'above' : 'in line with'} the sector median of ~25x`,
      type: 'EVIDENCE',
      agent: 'FUNDAMENTAL',
      confidence: 0.92,
    },
    {
      text: `Revenue growth of ${(revGrowth * 100).toFixed(1)}% ${revGrowth > 0.10 ? 'exceeds' : 'lags'} market expectations of 10–12%`,
      type: 'EVIDENCE',
      agent: 'FUNDAMENTAL',
      confidence: 0.88,
    },
    {
      text: `ROE of ${(roe * 100).toFixed(1)}% indicates ${roe > 0.12 ? 'efficient' : 'moderate'} capital utilization`,
      type: 'EVIDENCE',
      agent: 'FUNDAMENTAL',
      confidence: 0.85,
    },
    {
      text: `Current valuation ${peRatio > 30 ? 'prices in significant growth expectations, leaving limited margin of safety' : 'offers reasonable entry point relative to growth trajectory'}`,
      type: 'INFERENCE',
      agent: 'FUNDAMENTAL',
      confidence: confidence,
    },
    {
      text: `Earnings growth of ${(earningsGrowth * 100).toFixed(1)}% ${earningsGrowth > revGrowth ? 'outpaces' : 'lags behind'} revenue growth, suggesting ${earningsGrowth > revGrowth ? 'margin expansion' : 'margin compression'}`,
      type: 'INFERENCE',
      agent: 'FUNDAMENTAL',
      confidence: 0.7,
    },
  ];

  const evidence: Evidence[] = [
    {
      source: 'Simulated: Quarterly Financials',
      chunk: `P/E: ${peRatio.toFixed(1)}x | Revenue Growth: ${(revGrowth * 100).toFixed(1)}%`,
      relevance: 0.95,
      retrievedText: `Trailing twelve-month P/E ratio at ${peRatio.toFixed(1)}x with forward estimates at ${(peRatio * 0.88).toFixed(1)}x`,
    },
    {
      source: 'Simulated: Return Metrics',
      chunk: `ROE: ${(roe * 100).toFixed(1)}% | Earnings Growth: ${(earningsGrowth * 100).toFixed(1)}%`,
      relevance: 0.9,
      retrievedText: `Return on equity has ${roe > 0.12 ? 'improved from 10.8% to' : 'declined from 14.1% to'} ${(roe * 100).toFixed(1)}% YoY`,
    },
  ];

  return {
    agent: 'FUNDAMENTAL',
    output: {
      signal,
      confidence,
      claims,
      evidence,
      counterarguments: [
        'P/E ratios for conglomerate structures are inherently difficult to interpret due to diverse business mix',
        'Reported earnings may not fully reflect impairments in newer business verticals',
      ],
      uncertainty: `Fundamental analysis depends on reported financials which carry a 1-quarter lag. Valuation at ${peRatio.toFixed(1)}x requires sustained ${(revGrowth * 100).toFixed(0)}%+ growth to justify.`,
    },
    latencyMs: Math.round(performance.now() - start),
    status: 'SUCCESS',
  };
}

// ---------------------------------------------------------------
// SENTIMENT AGENT
// ---------------------------------------------------------------
export function runSentimentAgent(
  news: SyntheticNews[],
  _profile: RiskProfile
): AgentResult {
  const start = performance.now();

  const avgSentiment = news.reduce((s, n) => s + n.sentiment, 0) / news.length;

  let signal: Signal = 'NEUTRAL';
  let confidence = 0.5;

  if (avgSentiment > 0.3) {
    signal = 'BULLISH';
    confidence = 0.68;
  } else if (avgSentiment < -0.2) {
    signal = 'BEARISH';
    confidence = 0.64;
  } else {
    signal = 'NEUTRAL';
    confidence = 0.52;
  }

  const claims: Claim[] = news.map((n) => {
    const signalLabel = (n.eventSignal || 'MARKET_CATALYST').replace(/_/g, ' ');
    return {
      text: `"${n.headline}" — sentiment score ${n.sentiment > 0 ? '+' : ''}${n.sentiment.toFixed(2)} (${signalLabel})`,
      type: 'EVIDENCE' as const,
      agent: 'SENTIMENT' as AgentName,
      confidence: Math.abs(n.sentiment),
    };
  });

  claims.push({
    text: `Aggregate news sentiment is ${avgSentiment > 0.3 ? 'strongly positive' : avgSentiment > 0 ? 'mildly positive' : avgSentiment > -0.2 ? 'mixed' : 'negative'}, driven by ${news.filter(n => Math.abs(n.sentiment) > 0.5).length} high-impact headlines`,
    type: 'INFERENCE',
    agent: 'SENTIMENT',
    confidence: confidence,
  });

  const evidence: Evidence[] = news.map((n) => ({
    source: n.source || 'Simulated News Wire',
    chunk: n.headline,
    relevance: Math.abs(n.sentiment),
    retrievedText: `Event signal: ${n.eventSignal || 'GENERAL'} | Date: ${n.date || '2026-08-30'} | Sentiment: ${n.sentiment.toFixed(2)}`,
  }));

  return {
    agent: 'SENTIMENT',
    output: {
      signal,
      confidence,
      claims,
      evidence,
      counterarguments: [
        'News sentiment is a lagging indicator and often priced in by the time headlines appear',
        'Synthetic sentiment scores may not capture nuanced market psychology',
      ],
      uncertainty: `Sentiment analysis based on ${news.length} recent headlines. Small sample size limits conviction. Event signals suggest ${signal === 'BULLISH' ? 'positive catalysts' : signal === 'BEARISH' ? 'risk events' : 'mixed catalysts'} dominating.`,
    },
    latencyMs: Math.round(performance.now() - start),
    status: 'SUCCESS',
  };
}

// ---------------------------------------------------------------
// REGULATORY / RAG AGENT
// ---------------------------------------------------------------
export function runRegulatoryAgent(
  filings: SEBIFiling[],
  _profile: RiskProfile
): AgentResult {
  const start = performance.now();

  // Analyze the retrieved filings
  const riskSignals = filings.filter(f =>
    ['RISK_DISCLOSURE', 'COMPLIANCE', 'GOVERNANCE', 'SHAREHOLDING'].includes(f.category)
  );
  const positiveSignals = filings.filter(f =>
    ['CAPEX_PLAN', 'CORPORATE_ACTION', 'AGM_OUTCOME', 'FINANCIAL_RESULTS'].includes(f.category)
  );

  let signal: Signal = 'NEUTRAL';
  let confidence = 0.55;

  if (riskSignals.length > positiveSignals.length) {
    signal = 'BEARISH';
    confidence = 0.6;
  } else if (positiveSignals.length > riskSignals.length) {
    signal = 'BULLISH';
    confidence = 0.62;
  }

  const claims: Claim[] = filings.map(f => {
    const textChunk = (f.chunk || (f as unknown as Record<string, string>).excerpt || '').substring(0, 120);
    const filingId = f.id || (f as unknown as Record<string, string>).filingId || 'SEBI-FILING';
    return {
      text: `Filing [${filingId}]: ${textChunk}...`,
      type: 'EVIDENCE' as const,
      agent: 'REGULATORY' as AgentName,
      confidence: 0.85,
    };
  });

  claims.push({
    text: `Regulatory filings indicate ${signal === 'BEARISH' ? 'elevated compliance risks that warrant monitoring' : signal === 'BULLISH' ? 'proactive corporate actions suggesting forward planning' : 'standard regulatory posture without red flags'}`,
    type: 'INFERENCE',
    agent: 'REGULATORY',
    confidence: confidence,
  });

  const evidence: Evidence[] = filings.map(f => {
    const textChunk = f.chunk || (f as unknown as Record<string, string>).excerpt || '';
    const filingId = f.id || (f as unknown as Record<string, string>).filingId || 'SEBI-FILING';
    return {
      source: f.source || 'SEBI Regulatory Filing',
      chunk: textChunk,
      relevance: 0.88,
      retrievedText: `Category: ${f.category || 'DISCLOSURE'} | Date: ${f.date || '2026-08-15'} | ID: ${filingId}`,
    };
  });

  return {
    agent: 'REGULATORY',
    output: {
      signal,
      confidence,
      claims,
      evidence,
      counterarguments: [
        'Regulatory filings represent historical disclosures and may not reflect current risk posture',
        'Retrieved filings represent a targeted subset — broader context may alter interpretation',
      ],
      uncertainty: `Analysis based on ${filings.length} retrieved filing chunks. RAG retrieval covers limited categories. Material risks in unretrieved filings could change assessment.`,
    },
    latencyMs: Math.round(performance.now() - start),
    status: 'SUCCESS',
  };
}

// ---------------------------------------------------------------
// Run all agents concurrently
// ---------------------------------------------------------------
import { TickerSymbol } from './types';

export async function runAllAgents(
  profile: RiskProfile,
  shocked: boolean,
  dataConflict: boolean,
  ticker: TickerSymbol = 'RELIANCE',
): Promise<AgentResult[]> {
  console.log(`[ARGUS Multi-Agent] Initializing concurrent analysis for ${ticker} | Profile: ${profile} | Shocked: ${shocked} | Conflict: ${dataConflict}`);

  const marketData = generateMarketData(shocked, ticker);
  const news = generateNews(shocked, ticker);
  const filings = retrieveRelevantFilings('investment risk growth regulatory', ticker);

  // Simulate realistic latencies with Promise.all
  const technicalPromise = new Promise<AgentResult>((resolve) => {
    const delay = 200 + Math.random() * 300;
    setTimeout(() => {
      try {
        console.log(`[ARGUS Agent Exec] Running Technical Agent for ${ticker}...`);
        const result = runTechnicalAgent(marketData, profile, dataConflict);
        result.latencyMs = Math.round(delay);
        console.log(`[ARGUS Agent OK] Technical Agent completed with status: ${result.status}, signal: ${result.output.signal}`);
        resolve(result);
      } catch (err) {
        console.error('[ARGUS Agent FAILED] Technical Agent encountered error:', err);
        resolve({
          agent: 'TECHNICAL',
          output: { signal: 'NEUTRAL', confidence: 0.3, claims: [], evidence: [], counterarguments: [], uncertainty: 'Technical agent encountered an error' },
          latencyMs: Math.round(delay),
          status: 'FAILED',
          error: err instanceof Error ? err.stack || err.message : String(err),
        });
      }
    }, delay);
  });

  const fundamentalPromise = new Promise<AgentResult>((resolve) => {
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      try {
        console.log(`[ARGUS Agent Exec] Running Fundamental Agent for ${ticker}...`);
        const result = runFundamentalAgent(marketData, profile);
        result.latencyMs = Math.round(delay);
        console.log(`[ARGUS Agent OK] Fundamental Agent completed with status: ${result.status}, signal: ${result.output.signal}`);
        resolve(result);
      } catch (err) {
        console.error('[ARGUS Agent FAILED] Fundamental Agent encountered error:', err);
        resolve({
          agent: 'FUNDAMENTAL',
          output: { signal: 'NEUTRAL', confidence: 0.3, claims: [], evidence: [], counterarguments: [], uncertainty: 'Fundamental agent encountered an error' },
          latencyMs: Math.round(delay),
          status: 'FAILED',
          error: err instanceof Error ? err.stack || err.message : String(err),
        });
      }
    }, delay);
  });

  const sentimentPromise = new Promise<AgentResult>((resolve) => {
    const delay = 150 + Math.random() * 250;
    setTimeout(() => {
      try {
        console.log(`[ARGUS Agent Exec] Running Sentiment Agent for ${ticker} (${news.length} news items)...`);
        const result = runSentimentAgent(news, profile);
        result.latencyMs = Math.round(delay);
        console.log(`[ARGUS Agent OK] Sentiment Agent completed with status: ${result.status}, signal: ${result.output.signal}`);
        resolve(result);
      } catch (err) {
        console.error('[ARGUS Agent FAILED] Sentiment Agent encountered error:', err);
        resolve({
          agent: 'SENTIMENT',
          output: { signal: 'NEUTRAL', confidence: 0.3, claims: [], evidence: [], counterarguments: [], uncertainty: 'Sentiment agent encountered an error' },
          latencyMs: Math.round(delay),
          status: 'FAILED',
          error: err instanceof Error ? err.stack || err.message : String(err),
        });
      }
    }, delay);
  });

  const regulatoryPromise = new Promise<AgentResult>((resolve) => {
    const delay = 250 + Math.random() * 350;
    setTimeout(() => {
      try {
        console.log(`[ARGUS Agent Exec] Running Regulatory Agent for ${ticker} (${filings.length} filings)...`);
        const result = runRegulatoryAgent(filings, profile);
        result.latencyMs = Math.round(delay);
        console.log(`[ARGUS Agent OK] Regulatory Agent completed with status: ${result.status}, signal: ${result.output.signal}`);
        resolve(result);
      } catch (err) {
        console.error('[ARGUS Agent FAILED] Regulatory Agent encountered error:', err);
        resolve({
          agent: 'REGULATORY',
          output: { signal: 'NEUTRAL', confidence: 0.3, claims: [], evidence: [], counterarguments: [], uncertainty: 'Regulatory agent encountered an error' },
          latencyMs: Math.round(delay),
          status: 'FAILED',
          error: err instanceof Error ? err.stack || err.message : String(err),
        });
      }
    }, delay);
  });

  // TRUE concurrent execution
  return Promise.all([technicalPromise, fundamentalPromise, sentimentPromise, regulatoryPromise]);
}
