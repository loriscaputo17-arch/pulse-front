'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Music, Settings, LogOut, Sparkles, LucideIcon } from 'lucide-react';

const NAV = [
  { href: '/dashboard',          label: 'Home',     icon: LayoutDashboard },
  { href: '/dashboard/insights', label: 'Insights', icon: Sparkles        },
  { href: '/dashboard/tracks',   label: 'Songs',    icon: Music           },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings        },
];

export default function ArtistSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [artistName, setArtistName] = useState('');
  const [initials,   setInitials]   = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const name = user.user_metadata?.full_name ?? user.email ?? '';
      setArtistName(name);
      setInitials(name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?');
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

        .art-sidebar {
          width: 200px; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: rgba(6,6,12,0.98);
          border-right: 1px solid rgba(255,255,255,0.05);
          height: 100vh; position: sticky; top: 0;
        }

        /* Logo */
        .art-logo {
          height: 60px; padding: 0 18px;
          display: flex; align-items: center; gap: 9px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-decoration: none; flex-shrink: 0;
        }
        .art-logo-icon {
          width: 26px; height: 26px; border-radius: 8px;
          background: linear-gradient(135deg, #7c5cfc, #c084fc);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .art-logo-text {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800;
          color: #f0eeff; letter-spacing: -0.025em;
        }

        /* User card */
        .art-user {
          margin: 14px 12px 6px;
          padding: 12px 14px; border-radius: 12px;
          background: rgba(124,92,252,0.06);
          border: 1px solid rgba(124,92,252,0.12);
          display: flex; align-items: center; gap: 10px;
        }
        .art-avatar {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(124,92,252,0.4), rgba(192,132,252,0.4));
          border: 1px solid rgba(124,92,252,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800;
          color: #c4b5fd; letter-spacing: 0.03em;
        }
        .art-user-name {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          color: #c4c0d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .art-user-role {
          font-size: 10px; color: #7c7a8e; font-family: 'DM Sans', sans-serif;
          margin-top: 1px;
        }

        /* Nav */
        .art-nav { flex: 1; padding: 10px 10px; display: flex; flex-direction: column; gap: 2px; }

        .art-item {
          position: relative; display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; border-radius: 10px;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; color: #6b6880; cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .art-item:hover { background: rgba(255,255,255,0.04); color: #c4c0d8; }
        .art-item.active { background: rgba(124,92,252,0.1); color: #d4bbff; }
        .art-item:hover .art-icon { background: rgba(255,255,255,0.06); }
        .art-item.active .art-icon { background: rgba(124,92,252,0.18); }

        .art-icon {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          background: rgba(255,255,255,0.03); transition: background 0.15s;
        }

        /* Active left bar — subtler than admin */
        .art-bar {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2.5px; height: 14px; border-radius: 0 2px 2px 0;
          background: linear-gradient(180deg, #c4b5fd, #a78bfa);
        }

        .art-new {
          margin-left: auto; font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 2px 6px; border-radius: 5px;
          background: rgba(52,211,153,0.1); color: #34d399;
          border: 1px solid rgba(52,211,153,0.2);
        }

        /* Footer */
        .art-footer { padding: 10px; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
        .art-logout {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #6b6880; transition: background 0.15s, color 0.15s;
        }
        .art-logout:hover { background: rgba(248,113,113,0.07); color: #f87171; }
        .art-logout:hover .art-icon { background: rgba(248,113,113,0.12) !important; }
        .art-logout .art-icon { background: rgba(255,255,255,0.03); transition: background 0.15s; }
      `}</style>

      <aside className="art-sidebar">
        <Link href="/dashboard" className="art-logo">
          <div className="art-logo-icon">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="art-logo-text">Pulse</span>
        </Link>

        {/* User card */}
        {artistName && (
          <div className="art-user">
            <div className="art-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="art-user-name">{artistName}</div>
              <div className="art-user-role">Artist</div>
            </div>
          </div>
        )}

        <nav className="art-nav">
          {NAV.map(item => {
            const active = pathname === item.href;
            const isInsights = item.href.includes('insights');
            return (
              <Link key={item.href} href={item.href} className={`art-item${active ? ' active' : ''}`}>
                {active && <div className="art-bar" />}
                <div className="art-icon"><item.icon size={13} /></div>
                {item.label}
                {isInsights && !active && <span className="art-new">new</span>}
              </Link>
            );
          })}
        </nav>

        <div className="art-footer">
          <button className="art-logout" onClick={handleLogout}>
            <div className="art-icon"><LogOut size={13} /></div>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}