'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="home-root">
      {/* ── Animated Background Gradient Mesh ───────────────── */}
      <div className="gradient-mesh" />

      {/* ── 5. Live Market Ticker Strip ─────────────────────── */}
      <div className="ticker-tape-container">
        <div className="ticker-tape-content">
          <span className="ticker-item"><span className="ticker-name">NIFTY 50</span> <span className="ticker-val">24,380.15</span> <span className="ticker-up">▲ +0.42%</span></span>
          <span className="ticker-item"><span className="ticker-name">SENSEX</span> <span className="ticker-val">80,120.40</span> <span className="ticker-up">▲ +0.38%</span></span>
          <span className="ticker-item"><span className="ticker-name">RELIANCE</span> <span className="ticker-val">₹2,954.20</span> <span className="ticker-up">▲ +1.2%</span></span>
          <span className="ticker-item"><span className="ticker-name">TCS</span> <span className="ticker-val">₹4,150.80</span> <span className="ticker-up">▲ +0.8%</span></span>
          <span className="ticker-item"><span className="ticker-name">INFY</span> <span className="ticker-val">₹1,884.50</span> <span className="ticker-up">▲ +1.5%</span></span>
          <span className="ticker-item"><span className="ticker-name">HDFCBANK</span> <span className="ticker-val">₹1,642.30</span> <span className="ticker-down">▼ -0.4%</span></span>
          <span className="ticker-item"><span className="ticker-name">USD/INR</span> <span className="ticker-val">83.42</span> <span className="ticker-down">▼ -0.05%</span></span>
          <span className="ticker-item"><span className="ticker-name">BRENT CRUDE</span> <span className="ticker-val">$82.15</span> <span className="ticker-up">▲ +0.80%</span></span>
          {/* Duplicate loop */}
          <span className="ticker-item"><span className="ticker-name">NIFTY 50</span> <span className="ticker-val">24,380.15</span> <span className="ticker-up">▲ +0.42%</span></span>
          <span className="ticker-item"><span className="ticker-name">SENSEX</span> <span className="ticker-val">80,120.40</span> <span className="ticker-up">▲ +0.38%</span></span>
          <span className="ticker-item"><span className="ticker-name">RELIANCE</span> <span className="ticker-val">₹2,954.20</span> <span className="ticker-up">▲ +1.2%</span></span>
          <span className="ticker-item"><span className="ticker-name">TCS</span> <span className="ticker-val">₹4,150.80</span> <span className="ticker-up">▲ +0.8%</span></span>
          <span className="ticker-item"><span className="ticker-name">INFY</span> <span className="ticker-val">₹1,884.50</span> <span className="ticker-up">▲ +1.5%</span></span>
          <span className="ticker-item"><span className="ticker-name">HDFCBANK</span> <span className="ticker-val">₹1,642.30</span> <span className="ticker-down">▼ -0.4%</span></span>
        </div>
      </div>

      {/* ── 1. Nav Bar ──────────────────────────────────────── */}
      <nav className="home-nav-wrap">
        <div className="home-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/argus_logo.jpg" alt="ARGUS" className="brand-emblem" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.12em', color: '#00e5c3', fontFamily: 'JetBrains Mono, monospace' }}>
                ARGUS
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(0, 229, 195, 0.1)', color: '#00e5c3', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 229, 195, 0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                Institutional v2.5
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'none' }}>SOC-2 TYPE II</span>
            <Link href="/terminal" className="btn-glass-pill">
              Launch Terminal ⚡
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. Hero Section ─────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-eyebrow">
          <span>🛡</span> AI-NATIVE INVESTMENT INTELLIGENCE
        </div>

        <h1 className="hero-headline">
          Challenge every investment thesis<br />before capital is committed.
        </h1>

        <p className="hero-subheadline">
          An adversarial AI courtroom that pressure-tests your portfolio against regulatory filings, contradictory evidence, and red-team attacks — before you risk real capital.
        </p>

        <div className="hero-cta-group">
          <Link href="/terminal" className="btn-glass-pill btn-glass-pill-primary">
            Launch Terminal ⚡
          </Link>
          <a href="#how-it-works" className="link-secondary">
            See how it works ↓
          </a>
        </div>

        {/* 3D Perspective Mini Preview Card */}
        <div className="preview-3d-wrap">
          <div className="preview-3d-card">
            {/* Window bar */}
            <div className="preview-header-bar">
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="preview-dot" style={{ background: '#ff5f56' }} />
                <span className="preview-dot" style={{ background: '#ffbd2e' }} />
                <span className="preview-dot" style={{ background: '#27c93f' }} />
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                ARGUS TERMINAL — RELIANCE.NSE [TRIAL IN PROGRESS]
              </div>
              <div style={{ fontSize: '11px', color: '#00e5c3', fontFamily: 'JetBrains Mono, monospace' }}>
                LIVE SYNTHESIS
              </div>
            </div>

            {/* Mini preview content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Survival Score</div>
                  <div className="mono" style={{ fontSize: '32px', fontWeight: 800, color: '#00e5c3' }}>82</div>
                  <div style={{ fontSize: '9px', color: '#00e5c3' }}>STABLE THESIS</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '2px solid #00e5c3', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Courtroom Synthesis</div>
                  <div style={{ fontSize: '12px', color: '#d1d9e2', lineHeight: '1.4' }}>
                    Based on 4 of 4 agents reporting, RELIANCE receives an ACCUMULATE posture. Agent consensus remains strong with high evidence backing.
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Posture</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#00e5c3' }}>ACCUMULATE</div>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CONF: 74%</div>
                </div>
              </div>

              {/* Mini courtroom 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(0, 229, 195, 0.04)', border: '1px solid rgba(0, 229, 195, 0.2)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#00e5c3', marginBottom: '8px' }}>🟢 BULL CASE (4 CLAIMS)</div>
                  <div style={{ fontSize: '11px', color: '#a0aec0', lineHeight: '1.4' }}>
                    • Retail EBITDA expanded 23% YoY with digital commerce growth (FUNDAMENTAL · 92% CONF)<br />
                    • 5G subscriber additions drove 14.2% digital services revenue expansion (REGULATORY · 88% CONF)
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 71, 87, 0.04)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff4757', marginBottom: '8px' }}>🔴 BEAR CASE (3 CLAIMS)</div>
                  <div style={{ fontSize: '11px', color: '#a0aec0', lineHeight: '1.4' }}>
                    • High promoter share pledging of ₹3,200 Cr across non-operating entities (REGULATORY · 75% CONF)<br />
                    • Crude refining crack spread volatility could compress Q3 margins (TECHNICAL · 65% CONF)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. "How It Works" Flow ──────────────────────────── */}
      <section id="how-it-works" className="flow-section">
        <div className="section-label-center">Adversarial Architecture</div>
        <h2 className="section-title-center">How Argus Works</h2>

        <div className="flow-grid">
          <div className="flow-step-card">
            <div className="step-num">1</div>
            <div className="step-text">Select stock + investor profile</div>
          </div>

          <div className="flow-step-card">
            <div className="step-num">2</div>
            <div className="step-text">4 agents analyze in parallel — technical, fundamental, sentiment, regulatory</div>
          </div>

          <div className="flow-step-card">
            <div className="step-num">3</div>
            <div className="step-text">Red Team attacks the thesis before you see the verdict</div>
          </div>

          <div className="flow-step-card">
            <div className="step-num">4</div>
            <div className="step-text">Get a personalized decision, not a generic signal</div>
          </div>
        </div>
      </section>

      {/* ── 4. Differentiation Section ──────────────────────── */}
      <section className="diff-section">
        <div className="section-label-center">Core Differentiators</div>
        <h2 className="section-title-center">Why We Are Different</h2>

        <div className="diff-grid">
          <div className="diff-card">
            <div className="diff-icon">🔍</div>
            <div className="diff-title">Not a black box</div>
            <div className="diff-desc">
              Every inference cites direct regulatory chunks, market ticks, and news timestamps. You inspect the courtroom evidence for every claim.
            </div>
          </div>

          <div className="diff-card">
            <div className="diff-icon">🎯</div>
            <div className="diff-title">Not one-size-fits-all</div>
            <div className="diff-desc">
              The exact same stock data yields distinct, personalized postures tailored to Conservative, Moderate, or Aggressive investor mandates.
            </div>
          </div>

          <div className="diff-card">
            <div className="diff-icon">⚔</div>
            <div className="diff-title">Not overconfident</div>
            <div className="diff-desc">
              The Thesis Survival Score simulates adversarial attacks and stress tests your assumptions, showing exactly what could break the trade.
            </div>
          </div>
        </div>

        {/* Final CTA Bar */}
        <div style={{ textAlign: 'center', marginTop: '80px', padding: '40px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#f3f5f8', marginBottom: '12px' }}>
            Ready to put your investment thesis on trial?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Explore 4 NSE large-cap demo datasets across technical, fundamental, sentiment, and SEBI regulatory agents.
          </p>
          <Link href="/terminal" className="btn-glass-pill btn-glass-pill-primary">
            Launch Terminal Now ⚡
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '32px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
        <div>ARGUS — AI-Native Investment Intelligence Terminal · Institutional v2.5</div>
        <div style={{ marginTop: '6px' }}>Demo dataset: 4 NSE large-caps. Architecture supports unlimited tickers — scoped for demo reliability.</div>
      </footer>
    </div>
  );
}
