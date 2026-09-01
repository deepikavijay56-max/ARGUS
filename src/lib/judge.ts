// ============================================================
// ARGUS — Judge Agent + Red Team + Courtroom Builder
// ============================================================
import {
  AgentResult,
  JudgeVerdict,
  VerdictDecision,
  Conflict,
  ConfidenceBreakdown,
  CourtroomCase,
  RedTeamAttack,
  RedTeamResult,
  RiskProfile,
  Signal,
} from './types';
import { INVESTOR_PROFILES, SAMPLE_PORTFOLIO } from './data';

// ---------------------------------------------------------------
// Profile-aware weighting
// ---------------------------------------------------------------
function getAgentWeights(profile: RiskProfile): Record<string, number> {
  switch (profile) {
    case 'CONSERVATIVE':
      return { TECHNICAL: 0.15, FUNDAMENTAL: 0.35, SENTIMENT: 0.15, REGULATORY: 0.35 };
    case 'MODERATE':
      return { TECHNICAL: 0.25, FUNDAMENTAL: 0.30, SENTIMENT: 0.20, REGULATORY: 0.25 };
    case 'AGGRESSIVE':
      return { TECHNICAL: 0.35, FUNDAMENTAL: 0.25, SENTIMENT: 0.30, REGULATORY: 0.10 };
  }
}

function signalToScore(signal: Signal): number {
  switch (signal) {
    case 'BULLISH': return 1;
    case 'NEUTRAL': return 0;
    case 'BEARISH': return -1;
  }
}

// ---------------------------------------------------------------
// Detect Conflicts
// ---------------------------------------------------------------
function detectConflicts(results: AgentResult[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const successResults = results.filter(r => r.status !== 'FAILED');

  for (let i = 0; i < successResults.length; i++) {
    for (let j = i + 1; j < successResults.length; j++) {
      const a = successResults[i];
      const b = successResults[j];

      if (a.output.signal !== b.output.signal && a.output.signal !== 'NEUTRAL' && b.output.signal !== 'NEUTRAL') {
        const aEvidence = a.output.evidence[0]?.chunk || 'No specific evidence cited';
        const bEvidence = b.output.evidence[0]?.chunk || 'No specific evidence cited';

        conflicts.push({
          agents: [a.agent, b.agent],
          topic: `Signal disagreement: ${a.agent} is ${a.output.signal} while ${b.agent} is ${b.output.signal}`,
          description: `${a.agent} agent produces a ${a.output.signal} signal (confidence: ${(a.output.confidence * 100).toFixed(0)}%) while ${b.agent} agent produces a ${b.output.signal} signal (confidence: ${(b.output.confidence * 100).toFixed(0)}%). This disagreement reduces overall conviction.`,
          evidenceCause: `${a.agent}: "${aEvidence}" vs ${b.agent}: "${bEvidence}"`,
          confidenceImpact: -0.05,
        });
      }
    }
  }

  // Check for failed agents
  const failedAgents = results.filter(r => r.status === 'FAILED' || r.status === 'DEGRADED');
  for (const fa of failedAgents) {
    conflicts.push({
      agents: [fa.agent],
      topic: `${fa.agent} agent ${fa.status === 'FAILED' ? 'unavailable' : 'producing degraded output'}`,
      description: `The ${fa.agent} agent ${fa.status === 'FAILED' ? 'failed to produce results' : 'is operating in a degraded state with potentially unreliable output'}. ${fa.error || ''}. Judge is proceeding with remaining agents and applying a confidence penalty.`,
      evidenceCause: fa.error || 'Agent error or timeout',
      confidenceImpact: -0.12,
    });
  }

  return conflicts;
}

// ---------------------------------------------------------------
// Build Courtroom Cases
// ---------------------------------------------------------------
export function buildCourtroomCases(results: AgentResult[]): CourtroomCase[] {
  const cases: CourtroomCase[] = [];

  for (const result of results) {
    if (result.status === 'FAILED') continue;

    for (const claim of result.output.claims) {
      const side = claim.confidence > 0.5 && result.output.signal === 'BULLISH' ? 'BULL' :
                   claim.confidence > 0.5 && result.output.signal === 'BEARISH' ? 'BEAR' :
                   result.output.signal === 'BULLISH' ? 'BULL' : 'BEAR';

      const evidence = result.output.evidence.find(e => e.relevance > 0.7)?.chunk || 'See agent analysis for supporting data';

      cases.push({
        side,
        claim: claim.text,
        evidence,
        agent: result.agent,
        confidence: claim.confidence,
      });
    }
  }

  return cases;
}

// ---------------------------------------------------------------
// Judge Agent
// ---------------------------------------------------------------
export function runJudge(
  results: AgentResult[],
  profile: RiskProfile,
  redTeamResult?: RedTeamResult | null,
): JudgeVerdict {
  const start = performance.now();
  const weights = getAgentWeights(profile);
  const profileData = INVESTOR_PROFILES[profile];
  const conflicts = detectConflicts(results);

  // Weighted signal aggregation
  let weightedScore = 0;
  let totalWeight = 0;
  let totalConfidence = 0;
  let successCount = 0;

  for (const result of results) {
    const w = weights[result.agent] || 0.25;
    if (result.status === 'FAILED') continue;
    
    const statusMult = result.status === 'DEGRADED' ? 0.5 : 1;
    const score = signalToScore(result.output.signal) * result.output.confidence * statusMult;
    weightedScore += score * w;
    totalWeight += w;
    totalConfidence += result.output.confidence * w;
    successCount++;
  }

  if (totalWeight > 0) {
    weightedScore /= totalWeight;
    totalConfidence /= totalWeight;
  }

  // Conflict penalty
  const conflictPenalty = conflicts.reduce((sum, c) => sum + Math.abs(c.confidenceImpact), 0);
  totalConfidence = Math.max(0.1, totalConfidence - conflictPenalty);

  // Red Team adjustment
  let redTeamPenalty = 0;
  if (redTeamResult) {
    redTeamPenalty = (100 - redTeamResult.finalScore) / 500; // max ~0.08 penalty
    totalConfidence = Math.max(0.1, totalConfidence - redTeamPenalty);
    // If thesis survival is very low, shift signal toward bearish
    if (redTeamResult.finalScore < 50) {
      weightedScore -= 0.15;
    }
  }

  // Profile-sensitive decision mapping
  let decision: VerdictDecision;

  if (profile === 'CONSERVATIVE') {
    if (weightedScore > 0.35 && totalConfidence > 0.65) decision = 'ACCUMULATE';
    else if (weightedScore > 0.2 && totalConfidence > 0.5) decision = 'WATCH';
    else if (weightedScore > 0) decision = 'HOLD';
    else if (weightedScore > -0.2) decision = 'REDUCE EXPOSURE';
    else decision = 'AVOID ADDING';
  } else if (profile === 'AGGRESSIVE') {
    if (weightedScore > 0.15) decision = 'ACCUMULATE';
    else if (weightedScore > -0.05) decision = 'HOLD';
    else if (weightedScore > -0.2) decision = 'WATCH';
    else decision = 'REDUCE EXPOSURE';
  } else {
    // MODERATE
    if (weightedScore > 0.2 && totalConfidence > 0.4) decision = 'ACCUMULATE';
    else if (weightedScore > 0.1) decision = 'WATCH';
    else if (weightedScore > -0.1) decision = 'HOLD';
    else if (weightedScore > -0.25) decision = 'REDUCE EXPOSURE';
    else decision = 'AVOID ADDING';
  }

  // Portfolio fit
  const portfolioFit = SAMPLE_PORTFOLIO.relianceAllocation < 10
    ? 0.75
    : SAMPLE_PORTFOLIO.relianceAllocation < 15
    ? 0.5
    : 0.25;

  // Confidence breakdown
  const evidenceQuality = results.filter(r => r.status === 'SUCCESS').length / results.length;
  const agentAgreement = 1 - (conflicts.filter(c => c.agents.length > 1).length * 0.2);
  const dataFreshness = 0.82; // Simulated
  const finalConfidence = Math.round(
    ((evidenceQuality * 0.3) + (Math.max(0, agentAgreement) * 0.3) + (dataFreshness * 0.2) + (portfolioFit * 0.2)) * 100
  ) / 100;

  const confidenceBreakdown: ConfidenceBreakdown = {
    evidenceQuality: Math.round(evidenceQuality * 100) / 100,
    agentAgreement: Math.round(Math.max(0, agentAgreement) * 100) / 100,
    dataFreshness,
    portfolioFit,
    final: finalConfidence,
  };

  // Top reasons and risks
  const bullishAgents = results.filter(r => r.output.signal === 'BULLISH' && r.status !== 'FAILED');
  const bearishAgents = results.filter(r => r.output.signal === 'BEARISH' || r.status === 'FAILED');

  const topReasons = bullishAgents
    .flatMap(a => a.output.claims.filter(c => c.confidence > 0.6))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map(c => c.text);

  if (topReasons.length === 0) {
    topReasons.push('No strong bullish signals identified — decision driven by risk management');
  }

  const topRisks = [
    ...bearishAgents.flatMap(a => a.output.claims.filter(c => c.confidence > 0.5)).map(c => c.text),
    ...results.flatMap(a => a.output.counterarguments),
  ].slice(0, 3);

  if (topRisks.length === 0) {
    topRisks.push('Limited bearish signals — risk assessment constrained by available data');
  }

  // What would change
  const whatWouldChange = generateWhatWouldChange(profile, weightedScore, results);

  // Thesis
  const thesis = `Based on ${successCount} of 4 agents reporting (weighted for ${profileData.label} profile), RELIANCE receives a ${decision} posture. ${
    conflicts.length > 0
      ? `${conflicts.length} conflict(s) reduce conviction.`
      : 'Agent consensus is high.'
  } Portfolio concentration at ${SAMPLE_PORTFOLIO.relianceAllocation}% is ${
    SAMPLE_PORTFOLIO.relianceAllocation < 10 ? 'within acceptable limits' : 'elevated'
  } for this risk profile.`;

  return {
    decision,
    confidence: Math.round(totalConfidence * 100) / 100,
    topReasons,
    topRisks,
    thesis,
    conflicts,
    whatWouldChangeDecision: whatWouldChange,
    confidenceBreakdown,
    latencyMs: Math.round(performance.now() - start),
  };
}

function generateWhatWouldChange(profile: RiskProfile, score: number, results: AgentResult[]): string[] {
  const conditions: string[] = [];

  if (profile === 'CONSERVATIVE') {
    conditions.push('P/E ratio declining below 25x with sustained revenue growth above 12%');
    conditions.push('RSI falling below 35 with volume spike indicating institutional accumulation');
    conditions.push('Two consecutive quarters of earnings beat with margin expansion above 200bps');
  } else if (profile === 'AGGRESSIVE') {
    conditions.push('Momentum turning negative with RSI above 75 for 5+ consecutive sessions');
    conditions.push('Revenue growth decelerating below 8% with ROE falling below sector median');
    conditions.push('Regulatory action leading to material business disruption in Jio or Retail');
  } else {
    conditions.push('P/E ratio normalizing to 24–26x range through earnings growth rather than price correction');
    conditions.push('Clear resolution of crude oil headwind with Brent settling below $75/barrel');
    conditions.push('FII flows turning positive with net buying exceeding ₹5,000 crore/month');
  }

  return conditions;
}

// ---------------------------------------------------------------
// Red Team
// ---------------------------------------------------------------
export function runRedTeam(
  results: AgentResult[],
  verdict: JudgeVerdict,
  profile: RiskProfile,
): RedTeamResult {
  const start = performance.now();
  const initialScore = 82 + Math.floor(Math.random() * 6);

  const attacks: RedTeamAttack[] = [];

  // Attack 1: Weak assumptions
  const bullishClaims = results
    .filter(r => r.output.signal === 'BULLISH')
    .flatMap(r => r.output.claims.filter(c => c.type === 'INFERENCE'));

  if (bullishClaims.length > 0) {
    attacks.push({
      category: 'Weak Assumptions',
      description: `${bullishClaims.length} bullish inference(s) lack direct evidence support. Key assumption: "${bullishClaims[0]?.text.substring(0, 80)}..." is based on inference, not observed data.`,
      impact: 4 + Math.floor(Math.random() * 3),
    });
  }

  // Attack 2: Contradictory evidence
  if (verdict.conflicts.length > 0) {
    attacks.push({
      category: 'Contradictory Evidence',
      description: `${verdict.conflicts.length} active conflict(s) between agents. ${verdict.conflicts[0]?.description.substring(0, 100)}`,
      impact: 5 + Math.floor(Math.random() * 4),
    });
  }

  // Attack 3: Valuation risk
  const pe = results.find(r => r.agent === 'FUNDAMENTAL')?.output.evidence
    .find(e => e.source.includes('Quarterly'));
  attacks.push({
    category: 'Valuation Risk',
    description: `Current P/E ratio implies aggressive growth assumptions. A 15% earnings miss would push valuation to 33x+ trailing, above 90th percentile for the sector. ${pe ? 'Evidence: ' + pe.chunk : ''}`,
    impact: 6 + Math.floor(Math.random() * 3),
  });

  // Attack 4: Macro risk
  attacks.push({
    category: 'Macro Risk',
    description: 'Crude oil exposure (refining division ~35% of revenue) creates significant sensitivity to geopolitical disruptions. A $20/barrel spike would reduce refining margins by ~400bps.',
    impact: 4 + Math.floor(Math.random() * 3),
  });

  // Attack 5: Sentiment risk
  const negativeNews = results.find(r => r.agent === 'SENTIMENT')?.output.claims
    .filter(c => c.text.includes('-'));
  if (negativeNews && negativeNews.length > 0) {
    attacks.push({
      category: 'Sentiment Risk',
      description: `${negativeNews.length} negative headline(s) detected. Negative sentiment can trigger short-term selling pressure, especially from momentum-driven FII flows.`,
      impact: 3 + Math.floor(Math.random() * 2),
    });
  }

  // Attack 6: Portfolio concentration
  const profileData = INVESTOR_PROFILES[profile];
  const concentrationRisk = SAMPLE_PORTFOLIO.relianceAllocation > profileData.riskTolerance * 15;
  attacks.push({
    category: 'Portfolio Concentration',
    description: `Current allocation of ${SAMPLE_PORTFOLIO.relianceAllocation}% ${concentrationRisk ? 'exceeds' : 'is near the limit of'} recommended single-stock exposure for ${profileData.label} profile. ${concentrationRisk ? 'Adding more would increase unsystematic risk beyond acceptable thresholds.' : 'Further accumulation requires careful position sizing.'}`,
    impact: concentrationRisk ? 7 : 4,
  });

  let runningScore = initialScore;
  const processedAttacks = attacks.map(a => {
    runningScore -= a.impact;
    return a;
  });

  return {
    initialScore,
    attacks: processedAttacks,
    finalScore: Math.max(5, runningScore),
    latencyMs: Math.round(performance.now() - start),
  };
}
