'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiskProfile,
  TickerSymbol,
  AgentResult,
  JudgeVerdict,
  CourtroomCase,
  RedTeamResult,
  RedTeamAttack,
  PerformanceEntry,
  AnalysisSnapshot,
  AgentName,
} from '@/lib/types';
import { INVESTOR_PROFILES, SAMPLE_PORTFOLIO } from '@/lib/data';
import { AVAILABLE_STOCKS, getStockDataset } from '@/lib/stocks';

type AgentProgress = Record<string, 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'>;

export default function ArgusTerminalPage() {
  // ── State ──────────────────────────────────────────────────
  const [profile, setProfile] = useState<RiskProfile>('MODERATE');
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETE'>('IDLE');
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [courtroom, setCourtroom] = useState<CourtroomCase[]>([]);
  const [redTeam, setRedTeam] = useState<RedTeamResult | null>(null);
  const [perfLog, setPerfLog] = useState<PerformanceEntry[]>([]);
  const [shocked, setShocked] = useState(false);
  const [dataConflict, setDataConflict] = useState(false);
  const [ticker, setTicker] = useState<TickerSymbol>('RELIANCE');
  const [agentProgress, setAgentProgress] = useState<AgentProgress>({});
  const [redTeamAnimating, setRedTeamAnimating] = useState(false);
  const [animatedScore, setAnimatedScore] = useState<number | null>(null);
  const [visibleAttacks, setVisibleAttacks] = useState<RedTeamAttack[]>([]);
  const [shockBefore, setShockBefore] = useState<AnalysisSnapshot | null>(null);
  const [shockAfter, setShockAfter] = useState<AnalysisSnapshot | null>(null);

  const stockMeta = getStockDataset(ticker).meta;

  // ── Calculated Thesis Survival Score ───────────────────────
  const baseThesisScore = verdict
    ? (shocked
        ? 54
        : dataConflict
          ? 68
          : Math.min(94, Math.max(48, Math.round(verdict.confidence * 85 + 18 - verdict.conflicts.length * 4))))
    : 82;

  const currentThesisScore = animatedScore ?? redTeam?.finalScore ?? baseThesisScore;

  // Smooth numerical countdown counter (never shows a blank dash)
  const [displayScore, setDisplayScore] = useState<number>(82);

  useEffect(() => {
    const target = currentThesisScore;
    if (displayScore === target) return;
    const step = target > displayScore ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayScore(prev => {
        if (prev === target) {
          clearInterval(timer);
          return prev;
        }
        return prev + step;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [currentThesisScore, displayScore]);

  // ── Run Analysis ───────────────────────────────────────────
  const runAnalysis = useCallback(async (overrideProfile?: RiskProfile, overrideShocked?: boolean, overrideConflict?: boolean) => {
    const activeProfile = overrideProfile ?? profile;
    const activeShocked = overrideShocked ?? shocked;
    const activeConflict = overrideConflict ?? dataConflict;

    setStatus('RUNNING');
    setRedTeam(null);
    setRedTeamAnimating(false);
    setAnimatedScore(null);
    setVisibleAttacks([]);

    // Set all agents to pending
    const agents: AgentName[] = ['TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'REGULATORY'];
    const progress: AgentProgress = {};
    agents.forEach(a => { progress[a] = 'PENDING'; });
    progress['JUDGE'] = 'PENDING';
    progress['RED TEAM'] = 'PENDING';
    setAgentProgress({ ...progress });

    // Simulate streaming: stagger agent status changes
    setTimeout(() => setAgentProgress(p => ({ ...p, TECHNICAL: 'RUNNING' })), 50);
    setTimeout(() => setAgentProgress(p => ({ ...p, FUNDAMENTAL: 'RUNNING' })), 100);
    setTimeout(() => setAgentProgress(p => ({ ...p, SENTIMENT: 'RUNNING' })), 80);
    setTimeout(() => setAgentProgress(p => ({ ...p, REGULATORY: 'RUNNING' })), 120);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: activeProfile,
          ticker: ticker,
          shocked: activeShocked,
          dataConflict: activeConflict,
          runRedTeam: false,
        }),
      });

      const data = await res.json();

      // Update agent progress based on results
      const newProgress: AgentProgress = {};
      (data.agentResults as AgentResult[]).forEach((r: AgentResult) => {
        newProgress[r.agent] = r.status === 'FAILED' ? 'FAILED' : 'DONE';
      });
      newProgress['JUDGE'] = 'DONE';
      newProgress['RED TEAM'] = 'PENDING';
      setAgentProgress(newProgress);

      setAgentResults(data.agentResults);
      setVerdict(data.verdict);
      setCourtroom(data.courtroom);
      setStatus('COMPLETE');

      // Log performance
      const entry: PerformanceEntry = {
        timestamp: new Date().toLocaleTimeString(),
        technicalLatency: data.agentResults.find((r: AgentResult) => r.agent === 'TECHNICAL')?.latencyMs || 0,
        fundamentalLatency: data.agentResults.find((r: AgentResult) => r.agent === 'FUNDAMENTAL')?.latencyMs || 0,
        sentimentLatency: data.agentResults.find((r: AgentResult) => r.agent === 'SENTIMENT')?.latencyMs || 0,
        ragLatency: data.agentResults.find((r: AgentResult) => r.agent === 'REGULATORY')?.latencyMs || 0,
        judgeLatency: data.verdict?.latencyMs || 0,
        mock30DayAccuracy: 0.73,
      };
      setPerfLog(prev => [entry, ...prev].slice(0, 10));

      return data;
    } catch {
      agents.forEach(a => { progress[a] = 'FAILED'; });
      setAgentProgress({ ...progress });
      setStatus('COMPLETE');
      return null;
    }
  }, [profile, ticker, shocked, dataConflict]);

  // ── Auto-initialize Analysis on Mount ─────────────────────
  useEffect(() => {
    runAnalysis();
  }, []); // Run on initial mount so the terminal starts populated with full intelligence

  // ── Red Team ───────────────────────────────────────────────
  const runRedTeamAnalysis = useCallback(async () => {
    if (!verdict) return;

    setRedTeamAnimating(true);
    setAgentProgress(p => ({ ...p, 'RED TEAM': 'RUNNING' }));

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          ticker,
          shocked,
          dataConflict,
          runRedTeam: true,
        }),
      });

      const data = await res.json();

      if (data.redTeam) {
        const rt = data.redTeam as RedTeamResult;
        const startScore = rt.initialScore || baseThesisScore;
        setAnimatedScore(startScore);
        setVisibleAttacks([]);

        // Animate attacks landing one by one
        let currentScore = startScore;
        rt.attacks.forEach((attack, i) => {
          setTimeout(() => {
            currentScore -= attack.impact;
            setAnimatedScore(Math.max(5, currentScore));
            setVisibleAttacks(prev => [...prev, attack]);
          }, (i + 1) * 700);
        });

        // After animation, set final state
        setTimeout(() => {
          setRedTeam(rt);
          setVerdict(data.verdict);
          setAgentProgress(p => ({ ...p, 'RED TEAM': 'DONE' }));
          setRedTeamAnimating(false);
        }, (rt.attacks.length + 1) * 700);
      }
    } catch {
      setRedTeamAnimating(false);
      setAgentProgress(p => ({ ...p, 'RED TEAM': 'FAILED' }));
    }
  }, [verdict, profile, ticker, shocked, dataConflict, baseThesisScore]);

  // ── Market Shock Toggle ────────────────────────────────────
  const toggleMarketShock = useCallback(async () => {
    if (!shocked && verdict) {
      setShockBefore({
        decision: verdict.decision,
        confidence: verdict.confidence,
        thesisSurvival: redTeam?.finalScore ?? 82,
        portfolioConcentration: stockMeta.portfolioAllocation,
      });

      setShocked(true);
      const data = await runAnalysis(profile, true, dataConflict);
      if (data) {
        setShockAfter({
          decision: data.verdict.decision,
          confidence: data.verdict.confidence,
          thesisSurvival: data.redTeam?.finalScore ?? 54,
          portfolioConcentration: stockMeta.portfolioAllocation,
        });
      }
    } else {
      setShocked(false);
      setShockBefore(null);
      setShockAfter(null);
      await runAnalysis(profile, false, dataConflict);
    }
  }, [shocked, verdict, profile, dataConflict, redTeam, stockMeta.portfolioAllocation, runAnalysis]);

  // ── Data Conflict Toggle ────────────────────────────────────
  const toggleDataConflict = useCallback(async () => {
    const newConflict = !dataConflict;
    setDataConflict(newConflict);
    if (status === 'COMPLETE') {
      await runAnalysis(profile, shocked, newConflict);
    }
  }, [dataConflict, status, profile, shocked, runAnalysis]);

  // ── Profile Switch ──────────────────────────────────────────
  const switchProfile = useCallback(async (p: RiskProfile) => {
    setProfile(p);
    if (status === 'COMPLETE') {
      await runAnalysis(p, shocked, dataConflict);
    }
  }, [status, shocked, dataConflict, runAnalysis]);

  // ── Stock Ticker Switch ─────────────────────────────────────
  const switchTicker = useCallback(async (newTicker: TickerSymbol) => {
    setTicker(newTicker);
    if (status === 'COMPLETE') {
      await runAnalysis(profile, shocked, dataConflict);
    }
  }, [status, profile, shocked, dataConflict, runAnalysis]);

  // ── Render Helpers ──────────────────────────────────────────
  const getDecisionColor = (decision?: string) => {
    if (!decision) return '';
    if (decision === 'ACCUMULATE') return 'bullish';
    if (decision === 'WATCH' || decision === 'HOLD') return 'neutral';
    if (decision === 'REDUCE EXPOSURE' || decision === 'AVOID ADDING') return 'bearish';
    return 'neutral';
  };

  const bullCases = courtroom.filter(c => c.side === 'BULL');
  const bearCases = courtroom.filter(c => c.side === 'BEAR');

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div className="terminal-root">
      {/* ── Animated Background Gradient Mesh ───────────────── */}
      <div className="terminal-gradient-mesh" />

      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Live Market Ticker Tape ───────────────────────── */}
        <div className="ticker-tape-container" style={{ background: 'rgba(6, 9, 14, 0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="ticker-tape-content">
            <span className="ticker-item"><span className="ticker-name">NIFTY 50</span> <span className="ticker-val">24,380.15</span> <span className="ticker-up">▲ +0.42%</span></span>
            <span className="ticker-item"><span className="ticker-name">SENSEX</span> <span className="ticker-val">80,120.40</span> <span className="ticker-up">▲ +0.38%</span></span>
            <span className="ticker-item"><span className="ticker-name">RELIANCE</span> <span className="ticker-val">₹2,954.20</span> <span className={shocked && ticker === 'RELIANCE' ? "ticker-down" : "ticker-up"}>{shocked && ticker === 'RELIANCE' ? "▼ -2.4%" : "▲ +1.2%"}</span></span>
            <span className="ticker-item"><span className="ticker-name">TCS</span> <span className="ticker-val">₹4,150.80</span> <span className="ticker-up">▲ +0.8%</span></span>
            <span className="ticker-item"><span className="ticker-name">INFY</span> <span className="ticker-val">₹1,884.50</span> <span className="ticker-up">▲ +1.5%</span></span>
            <span className="ticker-item"><span className="ticker-name">HDFCBANK</span> <span className="ticker-val">₹1,642.30</span> <span className="ticker-down">▼ -0.4%</span></span>
            <span className="ticker-item"><span className="ticker-name">USD/INR</span> <span className="ticker-val">83.42</span> <span className="ticker-down">▼ -0.05%</span></span>
            <span className="ticker-item"><span className="ticker-name">BRENT CRUDE</span> <span className="ticker-val">$82.15</span> <span className="ticker-up">▲ +0.80%</span></span>
            {/* Duplicate for infinite loop */}
            <span className="ticker-item"><span className="ticker-name">NIFTY 50</span> <span className="ticker-val">24,380.15</span> <span className="ticker-up">▲ +0.42%</span></span>
            <span className="ticker-item"><span className="ticker-name">SENSEX</span> <span className="ticker-val">80,120.40</span> <span className="ticker-up">▲ +0.38%</span></span>
            <span className="ticker-item"><span className="ticker-name">RELIANCE</span> <span className="ticker-val">₹2,954.20</span> <span className="ticker-up">▲ +1.2%</span></span>
          </div>
        </div>

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="header-left">
            <img src="/argus_logo.jpg" alt="ARGUS Emblem" className="brand-emblem" />
            <div>
              <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ARGUS
                <span style={{ fontSize: '9px', background: 'rgba(0,229,195,0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,229,195,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>INSTITUTIONAL v2.5</span>
              </div>
              <div className="logo-sub">AI-Native Investment Intelligence Terminal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/"
              className="btn-glass-pill"
              style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}
            >
              ← Home
            </Link>
            <span className="simulated-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>🔒 SOC-2 TYPE II</span>
            <span className="simulated-badge" style={{ color: 'var(--accent)', background: 'rgba(0,229,195,0.08)', borderColor: 'rgba(0,229,195,0.2)' }}>⚡ GEMINI 2.5 FLASH</span>
          </div>
        </header>

        {/* ── Controls Bar (Glassmorphic) ────────────────────── */}
        <div className="controls-bar glass-panel" style={{ marginTop: '16px', padding: '14px 20px', borderRadius: '16px' }}>
          <div className="stock-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>Stock:</span>
              <select
                value={ticker}
                onChange={(e) => switchTicker(e.target.value as TickerSymbol)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(0, 229, 195, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {AVAILABLE_STOCKS.map(s => (
                  <option key={s.ticker} value={s.ticker} style={{ background: '#0a0e14', color: '#e8ecf1' }}>
                    {s.ticker} ({s.name})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{stockMeta.exchange}</span>
            </div>
            <div className="mono" style={{ fontSize: '15px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '14px' }}>
              ₹{stockMeta.currentPrice.toLocaleString()}
              <span style={{ color: shocked ? 'var(--bear)' : 'var(--bull)', marginLeft: '8px', fontWeight: 700 }}>
                {shocked ? '-2.4%' : `+${stockMeta.priceChangePct}%`}
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Spring Profile Tabs */}
          <div className="profile-selector" style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as RiskProfile[]).map(p => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`profile-btn ${profile === p ? 'active' : ''}`}
                onClick={() => switchProfile(p)}
                style={{ position: 'relative' }}
              >
                {p}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="btn-primary"
            onClick={() => runAnalysis()}
            disabled={status === 'RUNNING'}
            style={{ borderRadius: '10px', boxShadow: '0 0 20px rgba(0, 229, 195, 0.3)' }}
          >
            {status === 'RUNNING' ? 'Analyzing...' : '⚡ Analyze'}
          </motion.button>

          <button
            className={`btn-secondary ${shocked ? 'active' : ''}`}
            onClick={toggleMarketShock}
            disabled={status !== 'COMPLETE'}
            style={{ borderRadius: '10px' }}
          >
            {shocked ? '✓ ' : ''}Market Shock
          </button>

          <button
            className={`btn-secondary ${dataConflict ? 'active' : ''}`}
            onClick={toggleDataConflict}
            disabled={status === 'RUNNING'}
            style={{ borderRadius: '10px' }}
          >
            {dataConflict ? '✓ ' : ''}Inject Conflict
          </button>
        </div>

        {/* ── Compliance & Investor Profile Bar ───────────────── */}
        <div className="compliance-bar glass-panel" style={{ marginTop: '12px', borderRadius: '12px', padding: '10px 18px' }}>
          <div className="compliance-badge">
            <span className="compliance-icon">🛡</span> SEBI Regulated Data Stream
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
          <span>Risk Tolerance: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{INVESTOR_PROFILES[profile].riskTolerance}</span></span>
          <span>Horizon: <span style={{ color: 'var(--text-secondary)' }}>{INVESTOR_PROFILES[profile].investmentHorizon}</span></span>
          <span>Loss Tolerance: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{(INVESTOR_PROFILES[profile].lossTolerance * 100)}%</span></span>
          <span>Mandate: <span style={{ color: 'var(--text-secondary)' }}>{INVESTOR_PROFILES[profile].goal}</span></span>
        </div>

        {/* ── Agent Checklist (Spring Motion) ────────────────── */}
        <AnimatePresence>
          {status !== 'IDLE' && (
            <motion.div
              className="agent-progress"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ marginTop: '12px' }}
            >
              {['TECHNICAL', 'FUNDAMENTAL', 'SENTIMENT', 'REGULATORY', 'JUDGE', 'RED TEAM'].map((agent, i) => {
                const s = agentProgress[agent] || 'PENDING';
                return (
                  <motion.div
                    key={agent}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20, delay: i * 0.04 }}
                    className={`agent-status-item ${s === 'DONE' ? 'done' : s === 'RUNNING' ? 'running' : s === 'FAILED' ? 'failed' : ''}`}
                    style={{ borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <span className={`status-dot ${s === 'DONE' ? 'done' : s === 'RUNNING' ? 'running' : s === 'FAILED' ? 'failed' : ''}`} />
                    {s === 'DONE' ? '✓' : s === 'FAILED' ? '✗' : s === 'RUNNING' ? '◌' : '○'} {agent}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── IDLE STATE (Glassmorphic) ───────────────────────── */}
        {status === 'IDLE' && (
          <motion.div
            className="idle-dashboard glass-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            style={{ marginTop: '20px', borderRadius: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img src="/argus_logo.jpg" alt="ARGUS AI" style={{ width: '64px', height: '64px', borderRadius: '14px', border: '1px solid var(--accent)', boxShadow: '0 0 20px rgba(0, 229, 195, 0.25)' }} />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', color: '#f3f5f8' }}>
                    ARGUS CAPITAL TERMINAL
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Adversarial Multi-Agent Investment Intelligence Engine
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="btn-primary"
                onClick={() => runAnalysis()}
                style={{ padding: '12px 28px', fontSize: '14px', borderRadius: '10px' }}
              >
                ⚡ INITIALIZE THESIS TRIAL
              </motion.button>
            </div>

            {/* Interactive SVG Sparkline Chart */}
            <div className="sparkline-box" style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {stockMeta.ticker}.{stockMeta.exchange} ({stockMeta.name}) — 90-Day Trajectory Sparkline
                </div>
                <div className="mono" style={{ fontSize: '12px', color: 'var(--accent)' }}>
                  HIGH: ₹{stockMeta.sparklineHigh.toLocaleString()} &nbsp;|&nbsp; LOW: ₹{stockMeta.sparklineLow.toLocaleString()} &nbsp;|&nbsp; VOL: {stockMeta.volume24h}
                </div>
              </div>
              <svg viewBox="0 0 800 100" style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 70 Q 100 80, 200 40 T 400 50 T 600 20 T 800 35 L 800 100 L 0 100 Z" fill="url(#sparklineGrad)" />
                <path d="M 0 70 Q 100 80, 200 40 T 400 50 T 600 20 T 800 35" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                <circle cx="800" cy="35" r="4" fill="var(--accent)" />
              </svg>
            </div>

            {/* 3 Core Capability Cards */}
            <div className="idle-grid">
              <div className="idle-card glass-panel" style={{ borderRadius: '14px' }}>
                <div className="idle-card-icon">⚔</div>
                <div className="idle-card-title">Adversarial Red Teaming</div>
                <div className="idle-card-desc">
                  Stress-tests bullish investment hypotheses against regulatory filings, macro shocks, and financial counter-arguments.
                </div>
              </div>
              <div className="idle-card glass-panel" style={{ borderRadius: '14px' }}>
                <div className="idle-card-icon">⚖</div>
                <div className="idle-card-title">Investment Courtroom</div>
                <div className="idle-card-desc">
                  Synthesizes agent disagreements into a clear Bull vs Bear evidentiary trial with calculated Thesis Survival Scores.
                </div>
              </div>
              <div className="idle-card glass-panel" style={{ borderRadius: '14px' }}>
                <div className="idle-card-icon">🎯</div>
                <div className="idle-card-title">Personalized Posture</div>
                <div className="idle-card-desc">
                  Dynamically adjusts risk tolerance thresholds based on Conservative, Moderate, or Aggressive investor profiles.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RUNNING INITIAL STATE ─────────────────────────── */}
        {status === 'RUNNING' && !verdict && (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', marginTop: '24px', borderRadius: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px', display: 'inline-block' }}>⚡</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f3f5f8', marginBottom: '8px', letterSpacing: '0.02em' }}>
              INITIALIZING ADVERSARIAL THESIS TRIAL FOR {ticker}...
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Analyzing SEBI disclosures, technical momentum, fundamental valuation multiples, and sentiment catalysts across 4 parallel AI agents.
            </div>
            <div style={{ width: '280px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #00e5c3, #8b5cf6)', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        )}

        {/* ── RESULTS (Glassmorphism & Spring Animations) ─────── */}
        {verdict && (
          <div>
            {/* ── Main Hero Section (Glass Cards) ────────────── */}
            <div className="section" style={{ marginTop: '24px' }}>
              <div className="hero-grid">
                {/* Left: Score with SVG Circular Gauge & Animated Countdown */}
                <div className="hero-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '16px' }}>
                  <div className="hero-label">Thesis Survival Score</div>
                  <div className="gauge-container">
                    <svg viewBox="0 0 100 100" style={{ width: '120px', height: '120px', transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={displayScore > 60 ? 'var(--accent)' : displayScore > 40 ? 'var(--warning)' : 'var(--bear)'}
                        strokeWidth="8"
                        strokeDasharray="264"
                        initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 264 - (264 * displayScore) / 100 }}
                        transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <div className="gauge-score" style={{ color: displayScore > 60 ? 'var(--accent)' : displayScore > 40 ? 'var(--warning)' : 'var(--bear)' }}>
                        {displayScore}
                      </div>
                      <div className="gauge-label">/ 100</div>
                    </div>
                  </div>
                </div>

                {/* Center: Thesis (Glass Panel) */}
                <div className="hero-panel glass-panel center" style={{ borderRadius: '16px' }}>
                  <div className="hero-label">Investment Thesis</div>
                  <div className="hero-thesis-text">
                    {verdict.thesis}
                  </div>
                </div>

                {/* Right: Verdict (Glass Panel) */}
                <div className="hero-panel glass-panel" style={{ borderRadius: '16px' }}>
                  <div className="hero-label">Final Verdict</div>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`hero-verdict-value ${getDecisionColor(verdict.decision)}`}
                  >
                    {verdict.decision}
                  </motion.div>
                  <div className="mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Conf: {(verdict.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* ── Courtroom (Distinct Glass Claim Cards) ─────── */}
            <div className="section" style={{ marginTop: '32px' }}>
              <div className="courtroom-grid">
                {/* Bull Case Column */}
                <div>
                  <div className="courtroom-side-header bull glass-panel" style={{ borderRadius: '12px' }}>
                    🟢 Bull Case ({bullCases.length} Claims)
                  </div>
                  <div>
                    {bullCases.map((c, i) => (
                      <motion.div
                        key={i}
                        className="glass-claim-card bull"
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 15, delay: i * 0.07 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                            {c.agent} AGENT
                          </span>
                          <span className="confidence-pill bull">
                            {(c.confidence * 100).toFixed(0)}% CONF
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                          {c.claim}
                        </div>
                        <div className="glass-evidence-line">
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '6px' }}>Evidence:</span>
                          {c.evidence}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Bear Case Column */}
                <div>
                  <div className="courtroom-side-header bear glass-panel" style={{ borderRadius: '12px' }}>
                    🔴 Bear Case ({bearCases.length} Claims)
                  </div>
                  <div>
                    {bearCases.map((c, i) => (
                      <motion.div
                        key={i}
                        className="glass-claim-card bear"
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 15, delay: i * 0.07 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
                            {c.agent} AGENT
                          </span>
                          <span className="confidence-pill bear">
                            {(c.confidence * 100).toFixed(0)}% CONF
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                          {c.claim}
                        </div>
                        <div className="glass-evidence-line">
                          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginRight: '6px' }}>Evidence:</span>
                          {c.evidence}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Unresolved Conflicts (Glass Panel) ──────────── */}
            {verdict.conflicts.length > 0 && (
              <motion.div
                className="section"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                style={{ marginTop: '24px' }}
              >
                <div className="section-header">
                  <span className="section-title">⚠ Unresolved Conflicts</span>
                  <span className="section-line" />
                </div>
                <div className="conflict-banner glass-panel" style={{ borderRadius: '14px', border: '1px solid rgba(255, 167, 38, 0.3)' }}>
                  {verdict.conflicts.map((c, i) => (
                    <div key={i} style={{ marginBottom: i < verdict.conflicts.length - 1 ? '16px' : 0 }}>
                      <div className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)', marginBottom: '4px' }}>
                        {c.agents.join(' VS ')}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {c.topic}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        {c.evidenceCause}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Confidence Breakdown (Glass Grid) ──────────── */}
            <div className="section" style={{ marginTop: '24px' }}>
              <div className="section-header">
                <span className="section-title">Confidence Breakdown</span>
                <span className="section-line" />
              </div>
              <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '20px', borderRadius: '16px' }}>
                {[
                  { label: 'Evidence Quality', val: verdict.confidenceBreakdown.evidenceQuality > 0.8 ? 'HIGH' : 'MED' },
                  { label: 'Agent Agreement', val: verdict.confidenceBreakdown.agentAgreement > 0.7 ? 'STRONG' : 'MIXED' },
                  { label: 'Data Freshness', val: 'REAL-TIME' },
                  { label: 'Portfolio Fit', val: verdict.confidenceBreakdown.portfolioFit > 0.6 ? 'ALIGNED' : 'CAUTION' }
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="hero-label" style={{ marginBottom: '6px' }}>{stat.label}</div>
                    <div className="mono" style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Portfolio Context (Glass Panel) ─────────────── */}
            <div className="section" style={{ marginTop: '24px' }}>
              <div className="section-header">
                <span className="section-title">Portfolio Context</span>
                <span className="section-line" />
              </div>
              <div className="portfolio-concentration glass-panel" style={{ borderRadius: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {stockMeta.ticker} Allocation:
                </div>
                <div className="mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', minWidth: '60px' }}>
                  {stockMeta.portfolioAllocation}%
                </div>
                <div className="portfolio-bar-wrap" style={{ borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    className="portfolio-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${stockMeta.portfolioAllocation * 10}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                  <div className="portfolio-bar-limit" title="Recommended Limit: 10%" />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Limit: 10%
                </div>
              </div>
            </div>

            {/* ── Red Team Action (Glass Challenge Card) ──────── */}
            <div className="section" style={{ marginTop: '28px' }}>
              {!redTeam && !redTeamAnimating && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                  className="redteam-cta glass-panel"
                  onClick={runRedTeamAnalysis}
                  style={{ borderRadius: '14px', border: '1px solid rgba(255, 71, 87, 0.4)', color: '#ff4757' }}
                >
                  ⚔ WHY SHOULD I NOT INVEST?
                </motion.button>
              )}

              {(redTeamAnimating || redTeam) && (
                <motion.div
                  className="red-team-section glass-panel"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 16 }}
                  style={{ border: '1px solid rgba(255, 71, 87, 0.3)', background: 'rgba(255, 71, 87, 0.05)', borderRadius: '16px' }}
                >
                  <div className="red-team-header">
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bear)' }}>
                      Active Attack Vectors
                    </span>
                  </div>
                  <div className="attack-list">
                    {(redTeam ? redTeam.attacks : visibleAttacks).map((attack, i) => (
                      <motion.div
                        key={i}
                        className="attack-item"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                        style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px 16px', border: '1px solid rgba(255,71,87,0.15)', marginBottom: '8px' }}
                      >
                        <div className="attack-impact">↓ {attack.impact}</div>
                        <div className="attack-content">
                          <div className="attack-category">{attack.category}</div>
                          <div className="attack-desc">{attack.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer style={{ textAlign: 'center', padding: '28px 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '48px', color: 'var(--text-tertiary)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
          <div>ARGUS — AI-Native Investment Intelligence Terminal · Institutional v2.5</div>
          <div style={{ marginTop: '6px' }}>Demo dataset: 4 NSE large-caps. Architecture supports unlimited tickers — scoped for demo reliability.</div>
        </footer>
      </div>
    </div>
  );
}
