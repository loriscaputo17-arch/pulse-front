'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Music, Settings, LogOut, ShieldCheck, Sparkles, LucideIcon } from 'lucide-react';

const NAV = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/insights', label: 'Insights',  icon: Sparkles        },
  { href: '/dashboard/tracks',   label: 'Songs',     icon: Music           },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings        },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        .adm-sidebar { width:220px; flex-shrink:0; display:flex; flex-direction:column; background:rgba(8,8,16,0.95); border-right:1px solid rgba(255,255,255,0.06); backdrop-filter:blur(20px); height:100vh; position:sticky; top:0; }
        .adm-logo { height:64px; padding:0 20px; display:flex; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); gap:10px; text-decoration:none; flex-shrink:0; }
        .adm-logo-icon { width:28px; height:28px; border-radius:9px; background:linear-gradient(135deg,#7c5cfc,#c084fc); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .adm-logo-text { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#f0eeff; letter-spacing:-0.025em; }
        .adm-badge-wrap { padding:0 12px 12px; }
        .adm-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:8px; background:rgba(124,92,252,0.1); border:1px solid rgba(124,92,252,0.2); font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600; color:#a78bfa; letter-spacing:0.06em; text-transform:uppercase; }
        .adm-nav { flex:1; padding:8px 10px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
        .adm-section-label { font-family:'DM Sans',sans-serif; font-size:10px; font-weight:600; color:rgba(124,122,142,0.5); letter-spacing:0.1em; text-transform:uppercase; padding:10px 12px 4px; }
        .adm-divider { height:1px; background:rgba(255,255,255,0.06); margin:8px 10px; }
        .adm-item { position:relative; display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:11px; text-decoration:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#7c7a8e; cursor:pointer; transition:background 0.15s, color 0.15s; }
        .adm-item:hover { background:rgba(255,255,255,0.05); color:#c4c0d8; }
        .adm-item.active { background:rgba(124,92,252,0.12); color:#a78bfa; }
        .adm-item .adm-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:rgba(255,255,255,0.04); transition:background 0.15s; }
        .adm-item.active .adm-icon { background:rgba(124,92,252,0.2); }
        .adm-item:hover .adm-icon { background:rgba(255,255,255,0.07); }
        .adm-bar { position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:18px; border-radius:0 2px 2px 0; background:linear-gradient(180deg,#a78bfa,#7c5cfc); }
        .adm-new { margin-left:auto; font-size:9px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:2px 6px; border-radius:5px; background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.25); }
        .adm-admin-tag { margin-left:auto; font-size:9px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:2px 6px; border-radius:5px; background:rgba(124,92,252,0.15); color:#a78bfa; border:1px solid rgba(124,92,252,0.25); }
        .adm-footer { padding:10px; border-top:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
        .adm-logout { width:100%; display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:11px; border:none; background:transparent; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#7c7a8e; transition:background 0.15s, color 0.15s; }
        .adm-logout:hover { background:rgba(248,113,113,0.08); color:#f87171; }
        .adm-logout:hover .adm-icon { background:rgba(248,113,113,0.15) !important; }
        .adm-logout .adm-icon { background:rgba(255,255,255,0.04); transition:background 0.15s; }
      `}</style>

      <aside className="adm-sidebar">
        <Link href="/dashboard" className="adm-logo">
          <div className="adm-logo-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="adm-logo-text">Pulse</span>
        </Link>

        <div style={{ padding: '10px 12px 4px' }}>
          <div className="adm-badge">
            <ShieldCheck size={10} />
            Admin
          </div>
        </div>

        <nav className="adm-nav">
          <div className="adm-section-label">Main</div>
          {NAV.map(item => {
            const active = pathname === item.href;
            const isInsights = item.href.includes('insights');
            return (
              <Link key={item.href} href={item.href} className={`adm-item${active ? ' active' : ''}`}>
                {active && <div className="adm-bar" />}
                <div className="adm-icon"><item.icon size={14} /></div>
                {item.label}
                {isInsights && !active && <span className="adm-new">new</span>}
              </Link>
            );
          })}

          <div className="adm-divider" />
          <div className="adm-section-label">Admin</div>

          <Link href="/admin" className={`adm-item${pathname.startsWith('/admin') ? ' active' : ''}`}>
            {pathname.startsWith('/admin') && <div className="adm-bar" />}
            <div className="adm-icon"><ShieldCheck size={14} /></div>
            Admin Panel
            <span className="adm-admin-tag">admin</span>
          </Link>
        </nav>

        <div className="adm-footer">
          <button className="adm-logout" onClick={handleLogout}>
            <div className="adm-icon"><LogOut size={14} /></div>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}