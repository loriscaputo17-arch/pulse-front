'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusedField === field ? 'rgba(124,92,252,0.7)' : 'rgba(255,255,255,0.08)'}`,
    color: '#f0eeff',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(124,92,252,0.15)' : 'none',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500@display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(24px,-18px) scale(1.06); }
          70%      { transform: translate(-16px,12px) scale(0.96); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(124,92,252,0.5); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }

        .login-card { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .login-row  { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.19s; }
        .d4 { animation-delay: 0.26s; }
        .d5 { animation-delay: 0.33s; }
        .d6 { animation-delay: 0.40s; }

        .error-shake { animation: shake 0.4s ease; }

        .submit-btn {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          background: #7c5cfc;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 24px rgba(124,92,252,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #9370ff;
          transform: translateY(-1px);
          box-shadow: 0 0 36px rgba(124,92,252,0.6);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .divider-line {
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .social-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #9d9ab0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: #f0eeff;
        }

        .signup-link {
          color: #a78bfa;
          cursor: pointer;
          transition: color 0.15s;
          text-decoration: none;
        }
        .signup-link:hover { color: #c4b5fd; text-decoration: underline; }

        /* noise overlay */
        .noise::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        }
      `}</style>

      <main className="noise" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#05050a',
        fontFamily: "'DM Sans', sans-serif",
        color: '#f0eeff',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '20%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'orb-drift 14s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '15%',
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'orb-drift 18s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(124,92,252,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
        }} />

        {/* Card */}
        <div className="login-card" style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 420,
          borderRadius: 24,
          background: 'rgba(13,13,22,0.75)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,252,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '40px 36px 36px',
        }}>

          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.8), transparent)',
            borderRadius: 1,
          }} />

          {/* Logo */}
          <div className="login-row d1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #7c5cfc, #c084fc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-ring 2.5s ease-in-out infinite',
              boxShadow: '0 8px 24px rgba(124,92,252,0.4)',
            }}>
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="login-row d2" style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f0eeff',
              margin: 0,
            }}>Welcome back</h1>
            <p style={{ margin: '0 0 0', fontSize: 14, color: '#7c7a8e', fontWeight: 300 }}>
              Sign in to your Pulse dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Error */}
            {error && (
              <div className="error-shake" style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#fca5a5" strokeWidth="1.3"/><path d="M8 5v3.5M8 11h.01" stroke="#fca5a5" strokeWidth="1.3" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="login-row d3" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle('email')}
              />
            </div>

            {/* Password */}
            <div className="login-row d4" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <a href="/forgot-password" style={{ fontSize: 12, color: '#7c5cfc', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7c5cfc'}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                style={inputStyle('password')}
              />
            </div>

            {/* Submit */}
            <div className="login-row d5" style={{ marginTop: 6 }}>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <><div className="spinner" /> Signing in…</>
                ) : (
                  <>Sign in <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="login-row d5" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div className="divider-line" />
              <span style={{ fontSize: 11, color: '#7c7a8e', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
              <div className="divider-line" />
            </div>

            {/* Social */}
            <div className="login-row d6" style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button type="button" className="social-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}