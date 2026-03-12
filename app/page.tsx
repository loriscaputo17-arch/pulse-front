"use client";
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (injected once via <style>)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #05050a;
      --surface: #0d0d16;
      --border: rgba(255,255,255,0.07);
      --accent: #7c5cfc;
      --accent-bright: #a78bfa;
      --accent-glow: rgba(124,92,252,0.35);
      --text: #f0eeff;
      --muted: #7c7a8e;
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* ── Noise texture overlay ── */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }

    /* ── Animations ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.95); box-shadow: 0 0 0 0 var(--accent-glow); }
      70%  { transform: scale(1);    box-shadow: 0 0 0 14px transparent; }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes grid-scroll {
      0%   { transform: translateY(0); }
      100% { transform: translateY(-50%); }
    }
    @keyframes orb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(30px, -20px) scale(1.05); }
      66%       { transform: translate(-20px, 15px) scale(0.97); }
    }
    @keyframes bar-grow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes counter-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes badge-pop {
      0%   { opacity:0; transform:scale(0.8) translateY(-6px); }
      60%  { transform:scale(1.05) translateY(0); }
      100% { opacity:1; transform:scale(1) translateY(0); }
    }

    .animate-fade-up   { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
    .animate-fade-in   { animation: fadeIn 0.5s ease both; }
    .animate-float     { animation: float 4s ease-in-out infinite; }
    .animate-badge-pop { animation: badge-pop 0.5s cubic-bezier(0.22,1,0.36,1) both; }

    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; }
    .delay-600 { animation-delay: 0.6s; }

    /* ── Gradient text ── */
    .grad-text {
      background: linear-gradient(135deg, #a78bfa 0%, #7c5cfc 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Glass card ── */
    .glass {
      background: rgba(13,13,22,0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
    }

    /* ── Tag pill ── */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(124,92,252,0.3);
      background: rgba(124,92,252,0.1);
      color: var(--accent-bright);
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 26px;
      border-radius: 12px;
      background: var(--accent);
      color: #fff;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 0 24px rgba(124,92,252,0.4);
      text-decoration: none;
    }
    .btn-primary:hover {
      background: #9370ff;
      transform: translateY(-1px);
      box-shadow: 0 0 36px rgba(124,92,252,0.55);
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 26px;
      border-radius: 12px;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 600;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, transform 0.15s;
      text-decoration: none;
    }
    .btn-ghost:hover {
      border-color: rgba(124,92,252,0.5);
      color: var(--text);
      transform: translateY(-1px);
    }

    /* ── Horizontal rule with glow ── */
    .glow-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent) 40%, var(--accent-bright) 60%, transparent);
      opacity: 0.4;
    }

    /* ── Section headings ── */
    .section-label {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent-bright);
    }

    /* ── Nav link ── */
    .nav-link {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.15s;
      letter-spacing: 0.02em;
    }
    .nav-link:hover { color: var(--text); }

    /* ── Feature card hover ── */
    .feature-card {
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      border-color: rgba(124,92,252,0.35) !important;
    }
    .feature-card:hover .feature-icon {
      background: rgba(124,92,252,0.25);
      box-shadow: 0 0 20px rgba(124,92,252,0.3);
    }
    .feature-icon {
      transition: background 0.25s, box-shadow 0.25s;
    }

    /* ── Stat row hover ── */
    .stat-row { transition: background 0.2s; }
    .stat-row:hover { background: rgba(124,92,252,0.04); }

    /* ── Fake chart bars ── */
    .bar {
      transform-origin: left;
      animation: bar-grow 1.2s cubic-bezier(0.22,1,0.36,1) both;
    }
    .bar:nth-child(1) { animation-delay: 0.3s; }
    .bar:nth-child(2) { animation-delay: 0.45s; }
    .bar:nth-child(3) { animation-delay: 0.6s; }
    .bar:nth-child(4) { animation-delay: 0.75s; }
    .bar:nth-child(5) { animation-delay: 0.9s; }
  `}</style>
);

/* ─────────────────────────────────────────────
   NAVBAR  — floating pill, detached from edges
───────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* Outer wrapper — full width, just provides the top padding / centering */
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "16px 24px",
      pointerEvents: "none",          /* let clicks pass through the gap */
    }}>
      {/* The actual pill */}
      <nav style={{
        maxWidth: 960,
        margin: "0 auto",
        pointerEvents: "all",
        borderRadius: 18,
        border: `1px solid ${scrolled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}`,
        background: scrolled
          ? "rgba(8,8,16,0.82)"
          : "rgba(8,8,16,0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: scrolled
          ? "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "background 0.35s, box-shadow 0.35s, border-color 0.35s",
        overflow: "hidden",
      }}>
        {/* Main row */}
        <div style={{
          height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px",
        }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: "linear-gradient(135deg, #7c5cfc, #c084fc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              animation: "pulse-ring 2.5s ease-in-out infinite",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
              Pulse
            </span>
          </a>

          {/* Centre links — hidden on small screens */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["Features", "Analytics", "Preview", "Pricing"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                fontFamily: "var(--font-body)",
                fontSize: 13, fontWeight: 500,
                color: "var(--muted)", textDecoration: "none",
                padding: "6px 12px", borderRadius: 10,
                transition: "background 0.15s, color 0.15s",
                letterSpacing: "0.01em",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href="/login" style={{
              fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600,
              color: "var(--muted)", textDecoration: "none",
              padding: "7px 14px", borderRadius: 10,
              transition: "color 0.15s, background 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
            >Sign in</a>

            <a href="/signup" className="btn-primary" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}>
              Get started
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "120px 24px 80px" }}>

      {/* Orb 1 */}
      <div style={{
        position: "absolute", top: "8%", left: "15%",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,92,252,0.22) 0%, transparent 70%)",
        filter: "blur(40px)",
        animation: "orb-drift 12s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      {/* Orb 2 */}
      <div style={{
        position: "absolute", bottom: "10%", right: "10%",
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(192,132,252,0.15) 0%, transparent 70%)",
        filter: "blur(50px)",
        animation: "orb-drift 16s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />

      {/* Grid lines BG */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(124,92,252,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.06) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 800, margin: "0 auto" }}>

        {/* Badge */}
        <div className="animate-badge-pop" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px", borderRadius: 100, background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", marginBottom: 32 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", fontSize: 10 }}>✦</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-bright)", letterSpacing: "0.04em" }}>Introducing Pulse 2.0 — Now with AI forecasting</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, color: "var(--text)" }}>
          The analytics platform<br />
          <span className="grad-text">built for precision.</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up delay-200" style={{ marginTop: 24, fontSize: "clamp(15px, 2vw, 18px)", color: "var(--muted)", lineHeight: 1.7, maxWidth: 580, margin: "24px auto 0", fontWeight: 300 }}>
          Pulse transforms raw data into stunning, actionable intelligence. Monitor every metric that matters — in real time, at scale, with zero complexity. Built for founders, engineers and product teams who refuse to settle for mediocre tooling.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 40 }}>
          <a href="/signup" className="btn-primary">
            Start for free
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <a href="#showcase" className="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/></svg>
            Watch demo
          </a>
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400" style={{ marginTop: 48, display: "flex", gap: 24, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { val: "12k+", label: "Teams" },
            { val: "4.9★", label: "Rating" },
            { val: "99.99%", label: "Uptime" },
          ].map(s => (
            <div key={s.val} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Hero mockup */}
        <div className="animate-fade-up delay-500 animate-float" style={{ marginTop: 64, position: "relative" }}>
          <div style={{ position: "absolute", inset: -20, background: "radial-gradient(ellipse at center, rgba(124,92,252,0.25), transparent 70%)", borderRadius: 32, pointerEvents: "none" }} />
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  const bars = [55, 72, 44, 88, 63, 90, 52, 76, 95, 68, 80, 58];
  return (
    <div className="glass" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)", textAlign: "left" }}>
      {/* Top bar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", margin: "0 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>app.usepulse.io/dashboard</span>
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        {/* KPI cards */}
        {[
          { label: "Active Users", value: "28,491", change: "+12.4%", up: true },
          { label: "Revenue MRR", value: "$84,200", change: "+8.1%", up: true },
          { label: "Churn Rate", value: "1.8%", change: "-0.3%", up: false },
          { label: "Avg Session", value: "4m 32s", change: "+22s", up: true },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: k.up ? "#34d399" : "#f87171", fontWeight: 600 }}>{k.change}</div>
          </div>
        ))}

        {/* Chart */}
        <div style={{ gridColumn: "1 / 4", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>Revenue over time</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
            {bars.map((h, i) => (
              <div key={i} className="bar" style={{
                flex: 1, height: `${h}%`, borderRadius: 4,
                background: i === bars.length - 1
                  ? "linear-gradient(180deg, #a78bfa, #7c5cfc)"
                  : "rgba(124,92,252,0.25)",
              }} />
            ))}
          </div>
        </div>

        {/* Sidebar list */}
        <div style={{ gridColumn: "4 / 5", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Top Sources</div>
          {["Organic", "Direct", "Referral", "Social"].map((src, i) => (
            <div key={src} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ["#7c5cfc","#a78bfa","#34d399","#60a5fa"][i] }} />
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{src}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text)" }}>{[38, 24, 21, 17][i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────── */
const features = [
  {
    icon: "⚡",
    title: "Real-time event stream",
    desc: "Every click, conversion and session captured and visualised the moment it happens. Sub-50ms data latency means your dashboard reflects reality — not a stale snapshot from five minutes ago.",
  },
  {
    icon: "🎨",
    title: "Dark-first design system",
    desc: "Pulse was engineered from the ground up for dark environments. High-contrast data visualisations, carefully tuned colour ramps, and WCAG-AA compliant contrast ratios across every component.",
  },
  {
    icon: "🚀",
    title: "Sub-second load times",
    desc: "A globally distributed CDN, edge-cached queries, and an optimised rendering pipeline deliver dashboard loads under 800ms — even for datasets with hundreds of millions of rows.",
  },
  {
    icon: "🧩",
    title: "Composable widgets",
    desc: "Mix and match from 40+ pre-built chart and table widgets. Drag, resize and stack them freely. Every widget exposes a clean API so your engineering team can build custom extensions in hours.",
  },
  {
    icon: "🔐",
    title: "Enterprise-grade security",
    desc: "SOC 2 Type II certified. End-to-end encryption at rest and in transit. Role-based access control, SSO via SAML 2.0, and a full audit log for every action taken inside your workspace.",
  },
  {
    icon: "📈",
    title: "AI-powered forecasting",
    desc: "Pulse's built-in ML models analyse historical trends to surface proactive forecasts, anomaly alerts and growth opportunities — so you can act before problems become incidents.",
  },
];

function Features() {
  return (
    <section id="features" style={{ position: "relative", padding: "120px 24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(124,92,252,0.05) 50%, transparent)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ maxWidth: 600 }}>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span>✦</span> Platform
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text)" }}>
            Every tool you need.<br />
            <span className="grad-text">None of the bloat.</span>
          </h2>
          <p style={{ marginTop: 20, color: "var(--muted)", lineHeight: 1.75, fontSize: 16, maxWidth: 480 }}>
            Pulse packs a mature, battle-tested analytics stack into a single product. No more stitching together five different SaaS tools — everything lives under one roof, speaking one design language.
          </p>
        </div>

        {/* Cards */}
        <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass feature-card"
              style={{ borderRadius: 18, padding: "28px 30px", position: "relative", overflow: "hidden",
                animationName: "fadeUp", animationDuration: "0.6s", animationDelay: `${i * 0.08}s`, animationFillMode: "both", animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
            >
              {/* Subtle corner glow */}
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(124,92,252,0.12)", filter: "blur(30px)", pointerEvents: "none" }} />

              <div className="feature-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,92,252,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS
───────────────────────────────────────────── */
const stats = [
  {
    value: "99.99%",
    label: "Uptime SLA",
    desc: "Pulse runs on a multi-region, geo-redundant infrastructure spanning six cloud providers. Our architecture is engineered to eliminate single points of failure — not just patch them. Every quarter we publish a full reliability report so you can hold us accountable.",
  },
  {
    value: "<50ms",
    label: "Global p99 latency",
    desc: "We cache at the edge, pre-compute aggregations on ingestion, and optimise every query path end-to-end. Whether your team is in São Paulo, Singapore or Stockholm, dashboard loads feel instant. No spinner, no waiting, no excuses.",
  },
  {
    value: "10B+",
    label: "Events processed monthly",
    desc: "From early-stage startups tracking their first thousand users to enterprises with billions of monthly events, Pulse scales transparently. You never need to worry about infrastructure — just focus on the insights.",
  },
  {
    value: "40+",
    label: "Native integrations",
    desc: "Connect Pulse to your existing stack in minutes. Segment, Stripe, Salesforce, HubSpot, Postgres, BigQuery, Snowflake and dozens more — all with no-code setup, full schema mapping and incremental sync.",
  },
];

function Stats() {
  return (
    <section id="stats" style={{ position: "relative", padding: "120px 24px", background: "var(--surface)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.07), transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span>◈</span> By the numbers
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Infrastructure that earns<br />
            <span className="grad-text">your trust every day.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="stat-row" style={{
              padding: "36px 32px",
              borderTop: "1px solid var(--border)",
              borderLeft: i % 2 === 1 ? "1px solid var(--border)" : undefined,
              animationName: "fadeUp", animationDuration: "0.6s", animationDelay: `${i * 0.1}s`, animationFillMode: "both", animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em" }} className="grad-text">
                {s.value}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "8px 0 12px", letterSpacing: "-0.01em" }}>
                {s.label}
              </div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SHOWCASE
───────────────────────────────────────────── */
function Showcase() {
  return (
    <section id="showcase" style={{ position: "relative", padding: "120px 24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 0, top: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.15), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 80, alignItems: "center" }}>

        {/* Text */}
        <div>
          <div className="pill" style={{ marginBottom: 24 }}>
            <span>◎</span> Dashboard Preview
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text)" }}>
            A workspace that<br />
            <span className="grad-text">thinks like you do.</span>
          </h2>
          <p style={{ marginTop: 20, color: "var(--muted)", lineHeight: 1.75, fontSize: 15 }}>
            Pulse isn't a generic BI tool crammed with configuration. It's an opinionated product designed around the workflows of modern product teams — fast iteration cycles, async collaboration, and data that drives decisions at every level of the org.
          </p>
          <p style={{ marginTop: 16, color: "var(--muted)", lineHeight: 1.75, fontSize: 15 }}>
            Start with a pre-built template for SaaS, ecommerce or mobile apps, then customise every pixel with our no-code editor. When you need more power, drop into the SQL query layer or connect a custom data source via our open API.
          </p>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "40+ drag-and-drop chart widgets",
              "SQL & no-code query builder",
              "Collaborative workspaces with comments",
              "White-label exports (PDF, PNG, CSV)",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(124,92,252,0.2)", border: "1px solid rgba(124,92,252,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 14, color: "#b8b4cc" }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/signup" className="btn-primary">Start building</a>
            <a href="/docs" className="btn-ghost">Read the docs</a>
          </div>
        </div>

        {/* Visual */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -24, background: "radial-gradient(ellipse at 60% 40%, rgba(124,92,252,0.2), transparent 60%)", borderRadius: 32, pointerEvents: "none" }} />
          <ShowcaseMockup />
        </div>
      </div>
    </section>
  );
}

function ShowcaseMockup() {
  return (
    <div className="glass animate-float" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
      {/* Sidebar + main */}
      <div style={{ display: "flex", height: 400 }}>
        {/* Sidebar */}
        <div style={{ width: 52, background: "rgba(0,0,0,0.4)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 16 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--accent)" }} />
          {[0.4,0.2,0.5,0.3,0.2].map((o,i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: 6, background: `rgba(255,255,255,${o})` }} />
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Top row KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { l: "Users", v: "28.4k", c: "+12%" },
              { l: "Sessions", v: "142k", c: "+7%" },
              { l: "Revenue", v: "$84k", c: "+19%" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.l}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "4px 0 2px" }}>{k.v}</div>
                <div style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>{k.c}</div>
              </div>
            ))}
          </div>

          {/* Line chart area */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>Visitor Trend — Last 30 days</div>
            <svg width="100%" height="calc(100% - 24px)" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(124,92,252,0.4)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path d="M0 65 C20 60 40 45 70 50 C100 55 120 30 150 25 C180 20 210 35 240 20 C270 5 290 15 300 10" stroke="var(--accent)" strokeWidth="2" fill="none" />
              <path d="M0 65 C20 60 40 45 70 50 C100 55 120 30 150 25 C180 20 210 35 240 20 C270 5 290 15 300 10 L300 80 L0 80 Z" fill="url(#lineGrad)" />
            </svg>
          </div>

          {/* Bottom row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversion funnel</div>
              {[["Visits","100%","100%"],["Signups","32%","70%"],["Activated","18%","45%"],["Paid","9%","25%"]].map(([l,pct,w]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)", width: 48 }}>{l}</span>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div className="bar" style={{ height: "100%", width: w, background: "linear-gradient(90deg, #7c5cfc, #a78bfa)", borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, color: "var(--accent-bright)", fontWeight: 600, width: 28, textAlign: "right" }}>{pct}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Events</div>
              {["page_view","purchase","sign_up","click"].map((ev, i) => (
                <div key={ev} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ["#a78bfa","#34d399","#60a5fa","#fbbf24"][i], flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: "var(--muted)", flex: 1 }}>{ev}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{[1242,87,34,891][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
const testimonials = [
  {
    quote: "We replaced three separate tools with Pulse and cut our analytics overhead by 60%. The real-time stream alone has saved us from two major incidents this quarter.",
    name: "Sarah Chen",
    role: "Head of Product, Raycast",
    avatar: "SC",
  },
  {
    quote: "The dashboard builder is the first one I've seen that non-technical stakeholders actually want to use. It's fast, beautiful and doesn't hide the data.",
    name: "Marcus Webb",
    role: "CTO, Lemon Squeezy",
    avatar: "MW",
  },
  {
    quote: "Pulse forecasting flagged a retention drop 10 days before our next board meeting. We fixed it, and then presented the recovery instead of the problem.",
    name: "Priya Nair",
    role: "Growth Lead, Linear",
    avatar: "PN",
  },
];

function Testimonials() {
  return (
    <section style={{ padding: "100px 24px", background: "var(--surface)", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span>❝</span> Customer stories
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Loved by teams who ship fast.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {testimonials.map((t, i) => (
            <div key={t.name} className="glass feature-card" style={{ borderRadius: 18, padding: "28px 28px 24px",
              animationName: "fadeUp", animationDuration: "0.6s", animationDelay: `${i*0.1}s`, animationFillMode: "both", animationTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={{ fontSize: 28, color: "var(--accent)", marginBottom: 16, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 14.5, color: "#c4c0d8", lineHeight: 1.7, marginBottom: 24 }}>{t.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #7c5cfc, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ padding: "100px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative" }}>
        {/* Big glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(124,92,252,0.28), transparent 65%)", pointerEvents: "none" }} />

        <div className="pill" style={{ marginBottom: 28 }}>
          <span>◈</span> Get started free
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--text)" }}>
          Your data deserves<br />
          <span className="grad-text">better design.</span>
        </h2>
        <p style={{ marginTop: 20, fontSize: 16, color: "var(--muted)", lineHeight: 1.7, maxWidth: 460, margin: "20px auto 0" }}>
          Join 12,000+ teams already using Pulse. Free plan includes unlimited dashboards, 1M events/month, and 14-day data retention. No credit card required.
        </p>

        <div style={{ marginTop: 40, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/signup" className="btn-primary" style={{ fontSize: 15, padding: "15px 32px" }}>
            Create free account
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <a href="/demo" className="btn-ghost" style={{ fontSize: 15, padding: "15px 28px" }}>
            Book a demo
          </a>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
          No credit card · Cancel anytime · GDPR compliant
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "72px 24px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 60 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7c5cfc, #c084fc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Pulse</span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7, maxWidth: 260 }}>
              Real-time analytics for modern product teams. Built with performance and aesthetics in equal measure.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {["𝕏", "gh", "in"].map(s => (
                <div key={s} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)", cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Columns */}
          {[
            { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"] },
            { title: "Company", links: ["About", "Careers", "Blog", "Press", "Partners"] },
            { title: "Developers", links: ["Docs", "API Reference", "SDK", "Status", "GitHub"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookies", "DPA", "Security"] },
          ].map(col => (
            <div key={col.title}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16, letterSpacing: "0.02em" }}>
                {col.title}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", transition: "color 0.15s" }}
                      >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="glow-line" style={{ marginBottom: 28 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} Pulse Technologies, Inc. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Status", "Security", "Support", "Sitemap"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", transition: "color 0.15s" }}
                >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function PulseApp() {
  return (
    <>
      <GlobalStyles />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stats />
        <Showcase />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}