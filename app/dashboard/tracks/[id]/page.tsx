'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, Users, Bookmark, ListMusic, ArrowLeft, MapPin, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useArtist } from '../../../context/ArtistContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

function flag(iso: string | null | undefined) {
  if (!iso || iso.length !== 2) return '🌍';
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397));
}

/* ─── Fetch ────────────────────────────────────────────────────────────────── */

async function fetchTrackDetail(trackId: string, artistId: string) {
  const [
    { data: track },
    { data: daily },
    { data: playlists },
    { data: countries },
    { data: cities },
  ] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, title, image_url, streams, listeners, saves, playlist_adds, release_date')
      .eq('id', trackId)
      .eq('artist_id', artistId)
      .maybeSingle(),

    supabase
      .from('track_daily_metrics')
      .select('date, streams, listeners, saves, playlist_adds')
      .eq('track_id', trackId)
      .eq('artist_id', artistId)
      .order('date', { ascending: true }),

    supabase
      .from('track_playlists')
      .select('playlist, creator, streams')
      .eq('track_id', trackId)
      .eq('artist_id', artistId)
      .order('streams', { ascending: false })
      .limit(20),

    supabase
      .from('track_countries')
      .select('rank, country, iso, streams')
      .eq('track_id', trackId)
      .eq('artist_id', artistId)
      .order('rank', { ascending: true })
      .limit(10),

    supabase
      .from('track_cities')
      .select('rank, city, country, streams')
      .eq('track_id', trackId)
      .eq('artist_id', artistId)
      .order('rank', { ascending: true })
      .limit(10),
  ]);

  return {
    track:     track ?? null,
    daily:     daily ?? [],
    playlists: playlists ?? [],
    countries: countries ?? [],
    cities:    cities ?? [],
  };
}

/* ─── KpiCard ──────────────────────────────────────────────────────────────── */

function KpiCard({ title, value, icon, color }: {
  title: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      position: 'relative', borderRadius: 16, padding: '20px 22px',
      background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(16px)', overflow: 'hidden',
      transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), border-color 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,92,252,0.25)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: `${color}18`, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>{title}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ─── Daily Chart ──────────────────────────────────────────────────────────── */

const CHART_METRICS = [
  { key: 'streams',       label: 'Streams',       color: '#34d399' },
  { key: 'listeners',     label: 'Listeners',     color: '#a78bfa' },
  { key: 'saves',         label: 'Saves',         color: '#f472b6' },
  { key: 'playlist_adds', label: 'Playlist Adds', color: '#38bdf8' },
] as const;

type ChartKey = typeof CHART_METRICS[number]['key'];

function DailyChart({ data }: { data: any[] }) {
  const [active, setActive] = useState<ChartKey>('streams');
  const meta = CHART_METRICS.find(m => m.key === active)!;

  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      No daily data available yet
    </div>
  );

  return (
    <div>
      {/* metric switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {CHART_METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActive(m.key)}
            style={{
              padding: '5px 14px', borderRadius: 8, border: `1px solid ${active === m.key ? m.color + '55' : 'rgba(255,255,255,0.07)'}`,
              background: active === m.key ? m.color + '18' : 'transparent',
              color: active === m.key ? m.color : '#7c7a8e',
              fontSize: 12, fontWeight: 600, fontFamily: "'Syne',sans-serif", cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{m.label}</button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}
            tickFormatter={v => new Date(v).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}
            tickFormatter={v => fmt(v)} />
          <Tooltip
            content={({ active: a, payload, label }) => {
              if (!a || !payload?.length) return null;
              return (
                <div style={{ background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 10, padding: '10px 14px', fontFamily: "'DM Sans',sans-serif" }}>
                  <p style={{ fontSize: 11, color: '#7c7a8e', marginBottom: 5 }}>{new Date(String(label)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: meta.color, fontFamily: "'Syne',sans-serif" }}>{fmt(payload[0]?.value as number)}</p>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey={active} stroke={meta.color} strokeWidth={2} fill="url(#cg)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 24, backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(124,92,252,0.4) 40%,rgba(167,139,250,0.4) 60%,transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ color: '#a78bfa' }}>{icon}</span>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: '#f0eeff', margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Table helpers ────────────────────────────────────────────────────────── */

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: '24px 16px', textAlign: 'center', color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>{label}</td>
    </tr>
  );
}

const TH = ({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) => (
  <th style={{ padding: '0 16px 10px', fontSize: 10, fontWeight: 700, color: '#7c7a8e', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Sans',sans-serif", textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    {children}
  </th>
);

const TD = ({ children, align = 'left', color }: { children: React.ReactNode; align?: 'left' | 'right'; color?: string }) => (
  <td style={{ padding: '10px 16px', fontSize: 13, color: color ?? '#c4c0d8', fontFamily: "'DM Sans',sans-serif", textAlign: align, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
    {children}
  </td>
);

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function TrackDetailPage() {
  const { id }              = useParams();
  const router              = useRouter();
  const { currentArtist }   = useArtist();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentArtist || !id) return;
    setLoading(true);
    fetchTrackDetail(String(id), currentArtist.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id, currentArtist]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 34, height: 34, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>Loading tracks...</span>
    </div>
  );

  if (!data?.track) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      Traccia non trovata.
    </div>
  );

  const { track, daily, playlists, countries, cities } = data;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .td-wrap { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .td-s1{animation-delay:0s} .td-s2{animation-delay:0.07s} .td-s3{animation-delay:0.13s} .td-s4{animation-delay:0.19s} .td-s5{animation-delay:0.25s}
        .kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(min-width:640px){ .kpi-grid{ grid-template-columns:repeat(4,1fr); } }
        .geo-grid { display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:900px){ .geo-grid{ grid-template-columns:1fr 1fr; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Back */}
        <div className="td-wrap td-s1">
          <button
            onClick={() => router.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7c7a8e')}
          >
            <ArrowLeft size={14} /> Back to tracks
          </button>
        </div>

        {/* Header */}
        <div className="td-wrap td-s1" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {track.image_url ? (
            <Image src={track.image_url} alt={track.title} width={96} height={96} style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: 14, background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>🎵</div>
          )}
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
              {track.title}
            </h1>
            {track.release_date && (
              <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '6px 0 0' }}>
                Released {new Date(track.release_date).toLocaleDateString('en-EN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className={`td-wrap td-s2 kpi-grid`}>
          <KpiCard title="Streams"       value={fmt(track.streams)}       icon={<TrendingUp size={15}/>} color="#34d399" />
          <KpiCard title="Listeners"     value={fmt(track.listeners)}     icon={<Users size={15}/>}      color="#a78bfa" />
          <KpiCard title="Playlist Adds" value={fmt(track.playlist_adds)} icon={<ListMusic size={15}/>}  color="#38bdf8" />
          <KpiCard title="Saves"         value={fmt(track.saves)}         icon={<Bookmark size={15}/>}   color="#f472b6" />
        </div>

        {/* Daily chart */}
        <div className="td-wrap td-s3">
          <Section title="Daily Trend" icon={<TrendingUp size={15}/>}>
            <DailyChart data={daily} />
          </Section>
        </div>

        {/* Playlists */}
        <div className="td-wrap td-s4">
          <Section title="Top Playlists" icon={<ListMusic size={15}/>}>
            {playlists.length === 0 ? (
              <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>No playlist available.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>#</TH>
                    <TH>Playlist</TH>
                    <TH>Creator</TH>
                    <TH align="right">Streams</TH>
                  </tr>
                </thead>
                <tbody>
                  {playlists.map((p: any, i: number) => (
                    <tr key={i}>
                      <TD><span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', fontFamily: "'Syne',sans-serif" }}>{i + 1}</span></TD>
                      <TD><span style={{ fontWeight: 600, color: '#f0eeff' }}>{p.playlist}</span></TD>
                      <TD color="#7c7a8e">{p.creator ?? '—'}</TD>
                      <TD align="right"><span style={{ fontWeight: 700, color: '#34d399', fontFamily: "'Syne',sans-serif" }}>{fmt(p.streams)}</span></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>

        {/* Countries + Cities */}
        <div className={`td-wrap td-s5 geo-grid`}>
          <Section title="Top Countries" icon={<Globe size={15}/>}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>Country</TH>
                  <TH align="right">Streams</TH>
                </tr>
              </thead>
              <tbody>
                {countries.length === 0
                  ? <EmptyRow cols={3} label="No data available" />
                  : countries.map((c: any, i: number) => (
                    <tr key={i}>
                      <TD><span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', fontFamily: "'Syne',sans-serif" }}>{c.rank}</span></TD>
                      <TD>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{flag(c.iso)}</span>
                          <span style={{ fontWeight: 600, color: '#f0eeff' }}>{c.country}</span>
                        </span>
                      </TD>
                      <TD align="right"><span style={{ fontWeight: 700, color: '#34d399', fontFamily: "'Syne',sans-serif" }}>{fmt(c.streams)}</span></TD>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>

          <Section title="Top Cities" icon={<MapPin size={15}/>}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>City</TH>
                  <TH align="right">Streams</TH>
                </tr>
              </thead>
              <tbody>
                {cities.length === 0
                  ? <EmptyRow cols={3} label="No data available" />
                  : cities.map((c: any, i: number) => (
                    <tr key={i}>
                      <TD><span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', fontFamily: "'Syne',sans-serif" }}>{c.rank}</span></TD>
                      <TD>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f0eeff' }}>{c.city}</div>
                          <div style={{ fontSize: 11, color: '#7c7a8e' }}>{c.country}</div>
                        </div>
                      </TD>
                      <TD align="right"><span style={{ fontWeight: 700, color: '#34d399', fontFamily: "'Syne',sans-serif" }}>{fmt(c.streams)}</span></TD>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>
        </div>

      </div>
    </>
  );
}