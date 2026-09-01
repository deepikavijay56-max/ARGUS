// ============================================================
// ARGUS — Core Type Definitions
// ============================================================

// --- Ticker & Stock Data Structures ---
export type TickerSymbol = 'RELIANCE' | 'TCS' | 'INFY' | 'HDFCBANK';

export interface StockMetadata {
  ticker: TickerSymbol;
  name: string;
  sector: string;
  exchange: string;
  currentPrice: number;
  priceChangePct: number;
  peRatio: number;
  marketCap: string;
  portfolioAllocation: number;
  sparklineHigh: number;
  sparklineLow: number;
  volume24h: string;
}

export interface StockDataset {
  meta: StockMetadata;
  generateMarketData: (shocked?: boolean) => MarketData;
  generateNews: (shocked?: boolean) => SyntheticNews[];
  retrieveRelevantFilings: (query: string) => SEBIFiling[];
}

// --- Investor Profiles ---
export type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export interface InvestorProfile {
  id: RiskProfile;
  label: string;
  riskTolerance: number;      // 0–1
  investmentHorizon: string;
  lossTolerance: number;      // 0–1
  goal: string;
}

// --- Agent Contract ---
export type Signal = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface AgentOutput {
  signal: Signal;
  confidence: number;         // 0–1
  claims: Claim[];
  evidence: Evidence[];
  counterarguments: string[];
  uncertainty: string;
}

export interface Claim {
  text: string;
  type: 'EVIDENCE' | 'INFERENCE';
  agent: AgentName;
  confidence: number;
}

export interface Evidence {
  source: string;
  chunk: string;
  relevance: number;
  retrievedText: string;
}

export type AgentName = 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'REGULATORY';

export interface AgentResult {
  agent: AgentName;
  output: AgentOutput;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED' | 'DEGRADED';
  error?: string;
}

// --- Judge ---
export interface JudgeVerdict {
  decision: VerdictDecision;
  confidence: number;
  topReasons: string[];
  topRisks: string[];
  thesis: string;
  conflicts: Conflict[];
  whatWouldChangeDecision: string[];
  confidenceBreakdown: ConfidenceBreakdown;
  latencyMs: number;
}

export type VerdictDecision =
  | 'ACCUMULATE'
  | 'WATCH'
  | 'HOLD'
  | 'REDUCE EXPOSURE'
  | 'AVOID ADDING';

export interface Conflict {
  agents: AgentName[];
  topic: string;
  description: string;
  evidenceCause: string;
  confidenceImpact: number;
}

export interface ConfidenceBreakdown {
  evidenceQuality: number;
  agentAgreement: number;
  dataFreshness: number;
  portfolioFit: number;
  final: number;
}

// --- Courtroom ---
export interface CourtroomCase {
  side: 'BULL' | 'BEAR';
  claim: string;
  evidence: string;
  agent: AgentName;
  confidence: number;
}

// --- Red Team ---
export interface RedTeamAttack {
  category: string;
  description: string;
  impact: number;         // points deducted
}

export interface RedTeamResult {
  initialScore: number;
  attacks: RedTeamAttack[];
  finalScore: number;
  latencyMs: number;
}

// --- Market Shock ---
export interface MarketShockComparison {
  before: AnalysisSnapshot;
  after: AnalysisSnapshot;
}

export interface AnalysisSnapshot {
  decision: VerdictDecision;
  confidence: number;
  thesisSurvival: number;
  portfolioConcentration: number;
}

// --- Performance Log ---
export interface PerformanceEntry {
  timestamp: string;
  technicalLatency: number;
  fundamentalLatency: number;
  sentimentLatency: number;
  ragLatency: number;
  judgeLatency: number;
  mock30DayAccuracy: number;
}

// --- Full Analysis ---
export interface AnalysisState {
  status: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'ERROR';
  profile: RiskProfile;
  agentResults: AgentResult[];
  verdict: JudgeVerdict | null;
  courtroom: CourtroomCase[];
  redTeam: RedTeamResult | null;
  performanceLog: PerformanceEntry[];
  marketShockEnabled: boolean;
  dataConflictEnabled: boolean;
  shockComparison: MarketShockComparison | null;
  agentProgress: Record<string, 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'>;
}

// --- Synthetic Data ---
export interface MarketData {
  prices: number[];
  dates: string[];
  rsi: number[];
  volume: number[];
  pe: number;
  revenueGrowth: number;
  roe: number;
  earningsGrowth: number;
  momentum: number;
  volumeAnomaly: boolean;
}

export interface SyntheticNews {
  headline: string;
  sentiment: number; // -1 to 1
  source: string;
  date: string;
  eventSignal: string;
}

export interface SEBIFiling {
  id: string;
  source: string;
  chunk: string;
  date: string;
  category: string;
}

export interface PortfolioContext {
  totalValue: number;
  relianceAllocation: number; // percentage
  holdings: { name: string; allocation: number }[];
}
