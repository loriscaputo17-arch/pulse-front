'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Users, ImageUp, BarChart2, Music2, LayoutDashboard,
  LogOut, ShieldCheck, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/admin',         label: 'Overview',          icon: LayoutDashboard, exact: true  },
  { href: '/admin/users',   label: 'Users & Artists',   icon: Users,           exact: false },
  { href: '/admin/upload',  label: 'Upload Screenshots', icon: ImageUp,         exact: false },
  { href: '/admin/daily',   label: 'Upload Daily',      icon: BarChart2,       exact: false },
  { href: '/admin/tracks',  label: 'Import Tracks',     icon: Music2,          exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
      setReady(true);
    })();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!ready) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05050a' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .adm-shell { display: flex; height: 100vh; background: #05050a; color: #f0eeff; }

        /* ── Sidebar ── */
        .adm-sidebar {
          width: 232px; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: rgba(7,7,14,0.98);
          border-right: 1px solid rgba(255,255,255,0.06);
          height: 100vh; position: sticky; top: 0;
        }
        .adm-logo {
          height: 64px; padding: 0 18px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-decoration: none; flex-shrink: 0;
        }
        .adm-logo-icon {
          width: 28px; height: 28px; border-radius: 9px;
          background: linear-gradient(135deg, #7c5cfc, #c084fc);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .adm-logo-text { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #f0eeff; letter-spacing: -0.025em; }

        .adm-badge-row { padding: 12px 14px 4px; }
        .adm-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 8px;
          background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.2);
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700;
          color: #a78bfa; letter-spacing: 0.07em; text-transform: uppercase;
        }

        .adm-nav { flex: 1; padding: 10px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .adm-section { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; color: rgba(124,122,142,0.45); letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 12px 4px; }
        .adm-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 10px; }

        .adm-item {
          position: relative; display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 10px; text-decoration: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #6b6880; cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .adm-item:hover { background: rgba(255,255,255,0.04); color: #c4c0d8; }
        .adm-item.active { background: rgba(124,92,252,0.1); color: #d4bbff; }
        .adm-item .adm-icon {
          width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.03); transition: background 0.15s;
        }
        .adm-item:hover .adm-icon { background: rgba(255,255,255,0.06); }
        .adm-item.active .adm-icon { background: rgba(124,92,252,0.18); }
        .adm-bar {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2.5px; height: 14px; border-radius: 0 2px 2px 0;
          background: linear-gradient(180deg, #c4b5fd, #a78bfa);
        }

        .adm-footer { padding: 10px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
        .adm-back {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer; text-decoration: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #6b6880; transition: background 0.15s, color 0.15s; margin-bottom: 4px;
        }
        .adm-back:hover { background: rgba(124,92,252,0.08); color: #a78bfa; }
        .adm-back .adm-icon { background: rgba(255,255,255,0.03); }
        .adm-logout {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #6b6880; transition: background 0.15s, color 0.15s;
        }
        .adm-logout:hover { background: rgba(248,113,113,0.07); color: #f87171; }
        .adm-logout:hover .adm-icon { background: rgba(248,113,113,0.12) !important; }
        .adm-logout .adm-icon { background: rgba(255,255,255,0.03); transition: background 0.15s; }

        /* ── Main ── */
        .adm-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .adm-topbar {
          height: 60px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; background: rgba(5,5,10,0.9);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 40; flex-shrink: 0;
        }
        .adm-breadcrumb { display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #7c7a8e; }
        .adm-breadcrumb-current { color: #f0eeff; font-weight: 600; }
        .adm-content { flex: 1; overflow-y: auto; padding: 32px; }

        /* Shared card styles for child pages */
        .up-card { background:rgba(13,13,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:24px; backdrop-filter:blur(16px); position:relative; overflow:hidden; }
        .up-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent); }
        .up-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .up-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .up-label { font-size:11px; font-weight:600; color:#7c7a8e; letter-spacing:0.07em; text-transform:uppercase; font-family:'DM Sans',sans-serif; }
        .up-select { width:100%; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#f0eeff; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; appearance:none; cursor:pointer; transition:border-color 0.2s,box-shadow 0.2s; }
        .up-select:focus { border-color:rgba(124,92,252,0.6); box-shadow:0 0 0 3px rgba(124,92,252,0.1); }
        .upload-zone { cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:36px 20px; border:2px dashed rgba(124,92,252,0.25); border-radius:16px; transition:all 0.2s; background:rgba(124,92,252,0.04); }
        .upload-zone:hover,.upload-zone.over { background:rgba(124,92,252,0.09); border-color:rgba(124,92,252,0.6); }
        .file-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-top:16px; }
        .file-item { position:relative; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); }
        .file-item:hover .file-remove { opacity:1; }
        .file-thumb { width:100%; height:88px; object-fit:cover; display:block; }
        .file-name { padding:6px 8px; font-size:11px; color:#7c7a8e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .file-remove { position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:6px; border:none; background:rgba(0,0,0,0.75); color:#f87171; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
        .run-btn { width:100%; padding:12px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; transition:background 0.15s; box-shadow:0 0 20px rgba(124,92,252,0.35); display:flex; align-items:center; justify-content:center; gap:8px; }
        .run-btn:hover:not(:disabled) { background:#9370ff; }
        .run-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .up-grid { display:grid; grid-template-columns:280px 1fr; gap:24px; align-items:start; }
        @media(max-width:860px) { .up-grid { grid-template-columns:1fr; } }
        .info-box { padding:12px 14px; border-radius:10px; margin-top:4px; background:rgba(124,92,252,0.06); border:1px solid rgba(124,92,252,0.15); font-size:12px; color:#7c7a8e; line-height:1.65; }
        .info-box strong { display:block; font-size:10px; color:#a78bfa; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px; }
        .info-type { display:flex; align-items:center; gap:7px; padding:5px 0; font-size:12px; color:#7c7a8e; border-bottom:1px solid rgba(255,255,255,0.04); }
        .info-type:last-child { border-bottom:none; }
        .info-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .err-box { padding:10px 14px; border-radius:10px; margin-bottom:16px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.25); color:#f87171; font-size:13px; }
        .steps { display:flex; align-items:center; gap:8px; margin-bottom:28px; }
        .step-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:'Syne',sans-serif; transition:all 0.25s; }
        .step-dot.active { background:#7c5cfc; color:#fff; box-shadow:0 0 12px rgba(124,92,252,0.5); }
        .step-dot.done { background:rgba(52,211,153,0.2); color:#34d399; border:1px solid rgba(52,211,153,0.3); }
        .step-dot.idle { background:rgba(255,255,255,0.06); color:#7c7a8e; }
        .step-line { flex:1; height:1px; background:rgba(255,255,255,0.08); max-width:40px; }
        .processing-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:20px; text-align:center; }
        .result-item { border-radius:14px; padding:16px 18px; margin-bottom:10px; }
        .result-ok { background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.2); }
        .result-err { background:rgba(248,113,113,0.07); border:1px solid rgba(248,113,113,0.2); }
        .result-fname { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; margin-bottom:4px; }
        .result-ok .result-fname { color:#34d399; }
        .result-err .result-fname { color:#f87171; }
        .type-badge { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-left:8px; }
        .json-pre { background:rgba(0,0,0,0.4); border-radius:8px; padding:10px 12px; margin-top:8px; font-family:'Courier New',monospace; font-size:11px; color:#a78bfa; overflow-x:auto; white-space:pre-wrap; max-height:180px; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); }
        .done-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:24px; text-align:center; }
        .done-icon { width:56px; height:56px; border-radius:50%; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); display:flex; align-items:center; justify-content:center; font-size:22px; }
        .reset-btn { padding:10px 28px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; box-shadow:0 0 20px rgba(124,92,252,0.35); transition:background 0.15s; }
        .reset-btn:hover { background:#9370ff; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; opacity:0; }
        .d1{animation-delay:0.04s} .d2{animation-delay:0.10s}
        .spin-slow { animation:spin-slow 2s linear infinite; }
        .ut-card { background:rgba(13,13,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:24px; backdrop-filter:blur(16px); position:relative; overflow:hidden; }
        .ut-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent); }
        .ut-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .ut-bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
        @media(max-width:860px) { .ut-bottom-grid { grid-template-columns:1fr; } }
      `}</style>

      <div className="adm-shell">
        {/* ── Sidebar ── */}
        <aside className="adm-sidebar">
          <Link href="/dashboard" className="adm-logo">
            <div className="adm-logo-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="adm-logo-text">Pulse</span>
          </Link>

          <div className="adm-badge-row">
            <div className="adm-badge"><ShieldCheck size={10} /> Admin Panel</div>
          </div>

          <nav className="adm-nav">
            <div className="adm-section">Navigation</div>
            {NAV.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'
                ? true
                : pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`adm-item${active ? ' active' : ''}`}>
                  {active && <div className="adm-bar" />}
                  <div className="adm-icon"><item.icon size={14} /></div>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="adm-footer">
            <Link href="/dashboard" className="adm-back">
              <div className="adm-icon" style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutDashboard size={13} />
              </div>
              Back to Dashboard
            </Link>
            <button className="adm-logout" onClick={handleLogout}>
              <div className="adm-icon" style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={13} />
              </div>
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="adm-main">
          <header className="adm-topbar">
            <div className="adm-breadcrumb">
              <span>Admin</span>
              <ChevronRight size={13} />
              <span className="adm-breadcrumb-current">
                {NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? 'Panel'}
              </span>
            </div>
          </header>

          <div className="adm-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}