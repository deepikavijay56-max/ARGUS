// ============================================================
// ARGUS — Analysis API Route
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { runAllAgents } from '@/lib/agents';
import { runJudge, buildCourtroomCases, runRedTeam } from '@/lib/judge';
import { RiskProfile, TickerSymbol } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: RiskProfile = body.profile || 'MODERATE';
    const ticker: TickerSymbol = body.ticker || 'RELIANCE';
    const shocked: boolean = body.shocked || false;
    const dataConflict: boolean = body.dataConflict || false;
    const runRedTeamFlag: boolean = body.runRedTeam || false;

    // Phase 1: Run all 4 agents concurrently
    const agentResults = await runAllAgents(profile, shocked, dataConflict, ticker);

    // Phase 2: Build courtroom
    const courtroom = buildCourtroomCases(agentResults);

    // Phase 3: Run Judge
    const verdict = runJudge(agentResults, profile);

    // Phase 4: Optional Red Team
    let redTeamResult = null;
    if (runRedTeamFlag) {
      redTeamResult = runRedTeam(agentResults, verdict, profile);
      // Re-run judge with red team input
      const updatedVerdict = runJudge(agentResults, profile, redTeamResult);
      return NextResponse.json({
        agentResults,
        courtroom,
        verdict: updatedVerdict,
        redTeam: redTeamResult,
      });
    }

    return NextResponse.json({
      agentResults,
      courtroom,
      verdict,
      redTeam: null,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Fallback data will be used.' },
      { status: 500 }
    );
  }
}
