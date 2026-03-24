'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Users, Music2, ImageUp, BarChart2, ArrowRight, Clock } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Stats {
  users:   number;
  artists: number;
  tracks:  number;
}

interface ActivityRow {
  id:         number;
  artist_id:  string;
  date:       string;
  streams:    number;
  listeners:  number;
  artistName: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

/* ─── StatCard ───────────────────────────────────────────────────────────────── */

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <div style={{
      background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
      backdropFilter: 'blur(16px)',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color + '30'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}40 50%,transparent)` }} />
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color + '10', filter: 'blur(24px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '15', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(22px,2.5vw,28px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {typeof value === 'number' ? fmt(value) : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#7c7a8e', marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>{sub}</div>}
    </div>
  );
}

/* ─── QuickAction ────────────────────────────────────────────────────────────── */

function QuickAction({ href, icon, label, description, color }: {
  href: string; icon: React.ReactNode; label: string; description: string; color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px', borderRadius: 14,
        background: 'rgba(255,255,255,0.02)',
        border: '1.5px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color + '55'; (e.currentTarget as HTMLDivElement).style.background = color + '08'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '12', border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif" }}>{label}</div>
          <div style={{ fontSize: 11, color: '#7c7a8e', marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{description}</div>
        </div>
        <ArrowRight size={14} color="#7c7a8e" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function AdminOverviewPage() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: userCount },
        { count: artistCount },
        { count: trackCount },
        { data: recentDaily },
        { data: artistsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('tracks').select('*', { count: 'exact', head: true }),
        supabase.from('artist_overview_daily')
          .select('id, artist_id, date, streams, listeners')
          .order('date', { ascending: false })
          .limit(8),
        supabase.from('artists').select('id, name'),
      ]);

      setStats({
        users:   userCount ?? 0,
        artists: artistCount ?? 0,
        tracks:  trackCount ?? 0,
      });

      const artistMap = Object.fromEntries((artistsData ?? []).map(a => [a.id, a.name]));
      setActivity((recentDaily ?? []).map(r => ({
        ...r,
        artistName: artistMap[r.artist_id] ?? 'Unknown',
      })));

      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading overview…
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .ov-wrap { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .ov-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:900px) { .ov-grid { grid-template-columns:1fr 1fr; } }
        .ov-bottom { display:grid; grid-template-columns:1fr 340px; gap:20px; margin-top:20px; }
        @media(max-width:1000px) { .ov-bottom { grid-template-columns:1fr; } }
        .ov-card { background:rgba(13,13,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:22px; backdrop-filter:blur(16px); position:relative; overflow:hidden; }
        .ov-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(124,92,252,0.45) 40%,rgba(167,139,250,0.45) 60%,transparent); }
        .ov-card-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:18px; display:flex; align-items:center; gap:8px; }
        .act-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .act-row:last-child { border-bottom:none; }
        .act-dot { width:8px; height:8px; border-radius:50%; background:#a78bfa; flex-shrink:0; box-shadow:0 0 6px #a78bfa55; }
      `}</style>

      <div className="ov-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
            Overview
          </h1>
          <p style={{ fontSize: 13, color: '#7c7a8e', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>
            Platform status and quick actions
          </p>
        </div>

        {/* Stats */}
        <div className="ov-grid">
          <StatCard label="Total Users"   value={stats?.users   ?? 0} icon={<Users size={15}/>}   color="#a78bfa" sub="Registered accounts" />
          <StatCard label="Artists"       value={stats?.artists ?? 0} icon={<Music2 size={15}/>}  color="#34d399" sub="Active profiles" />
          <StatCard label="Tracks"        value={stats?.tracks  ?? 0} icon={<BarChart2 size={15}/>} color="#38bdf8" sub="In database" />
        </div>

        <div className="ov-bottom">

          {/* Activity log */}
          <div className="ov-card">
            <div className="ov-card-title">
              <Clock size={14} color="#a78bfa" />
              Recent activity
            </div>

            {activity.length === 0 ? (
              <div style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", padding: '16px 0' }}>
                No recent data uploads found.
              </div>
            ) : (
              activity.map((row, i) => (
                <div key={row.id} className="act-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="act-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f0eeff', fontFamily: "'DM Sans',sans-serif" }}>
                        {row.artistName}
                      </span>
                      <span style={{ fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>
                        {row.date}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: '#34d399', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>
                        {fmt(row.streams)} streams
                      </span>
                      <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>
                        {fmt(row.listeners)} listeners
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#52506a', fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
                    {timeAgo(row.date)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="ov-card">
            <div className="ov-card-title">
              ⚡ Quick actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <QuickAction
                href="/admin/users"
                icon={<Users size={18} />}
                label="Manage Users"
                description="Add users, assign roles & artists"
                color="#a78bfa"
              />
              <QuickAction
                href="/admin/upload"
                icon={<ImageUp size={18} />}
                label="Upload Screenshots"
                description="Bulk import from Spotify screenshots"
                color="#38bdf8"
              />
              <QuickAction
                href="/admin/daily"
                icon={<BarChart2 size={18} />}
                label="Upload Daily Metrics"
                description="Import daily chart data"
                color="#34d399"
              />
              <QuickAction
                href="/admin/tracks"
                icon={<Music2 size={18} />}
                label="Import Tracks"
                description="Upload track-level screenshots"
                color="#fb923c"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}