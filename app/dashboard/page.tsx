'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useArtist } from '../context/ArtistContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  TrendingUp, Users, Disc, Globe, Music,
  ListMusic, MapPin, PieChart, BarChart2,
  RefreshCw, Sparkles, ArrowUpRight, ArrowDownRight,
  Zap, Target, AlertCircle,
} from 'lucide-react';

async function fetchArtistStats(artistId: string) {
  const [
    { data: overview },
    { data: overview_daily },
    { data: top_countries },
    { data: location_countries },
    { data: location_cities },
    { data: segments },
    { data: demographics },
  ] = await Promise.all([
    supabase
      .from('artist_overview')
      .select('*')
      .eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('artist_overview_daily')
      .select('date, listeners, monthly_active_listeners, streams, streams_per_listener, saves, playlist_adds, followers')
      .eq('artist_id', artistId)
      .order('date', { ascending: true }),

    supabase
      .from('artist_countries')
      .select('rank, paese, iso, listeners')
      .eq('artist_id', artistId)
      .order('snapshot_date', { ascending: false })
      .order('rank', { ascending: true })
      .limit(5),

    supabase
      .from('artist_location_countries')
      .select('rank, country, iso, listeners, pct_active, active_listeners')
      .eq('artist_id', artistId)
      .order('snapshot_date', { ascending: false })
      .order('rank', { ascending: true })
      .limit(10),

    supabase
      .from('artist_location_cities')
      .select('rank, city, country, listeners')
      .eq('artist_id', artistId)
      .order('snapshot_date', { ascending: false })
      .order('rank', { ascending: true })
      .limit(10),

    supabase
      .from('artist_segments')
      .select('*')
      .eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('artist_demographics')
      .select('*')
      .eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    overview:           overview ?? null,
    overview_daily:     overview_daily ?? [],
    top_countries:      top_countries ?? [],
    location_countries: location_countries ?? [],
    location_cities:    location_cities ?? [],
    segments:           segments ?? null,
    demographics:       demographics ?? null,
  };
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

function pct(cur: number, prev: number) {
  if (!prev) return undefined;
  return parseFloat(((cur - prev) / prev * 100).toFixed(1));
}

function flag(iso: string | null | undefined) {
  if (!iso || iso.length !== 2) return '🌍';
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

/* ─── Insights Engine ──────────────────────────────────────────────────────── */

type Insight = {
  type: 'positive' | 'warning' | 'neutral';
  icon: React.ReactNode;
  title: string;
  body: string;
};

function buildInsights(data: any): Insight[] {
  const insights: Insight[] = [];
  const ov = data.overview;
  const daily: any[] = data.overview_daily ?? [];
  const seg = data.segments;
  const demo = data.demographics;
  const countries: any[] = data.location_countries ?? [];

  if (!ov) return insights;

  // Streams per listener
  const spl = Number(ov.streams_per_listener ?? 0);
  if (spl >= 3) {
    insights.push({
      type: 'positive',
      icon: <Zap size={14} />,
      title: 'High engagement rate',
      body: `Your streams/listener ratio is ${spl.toFixed(2)} — listeners are coming back repeatedly. This signals strong catalogue depth or playlist performance.`,
    });
  } else if (spl > 0 && spl < 1.5) {
    insights.push({
      type: 'warning',
      icon: <AlertCircle size={14} />,
      title: 'Low repeat listening',
      body: `Streams per listener is ${spl.toFixed(2)}. Most listeners are not returning — consider promoting deeper catalogue cuts or creating playlist series.`,
    });
  }

  // Daily trend (last 7 days)
  if (daily.length >= 7) {
    const recent  = daily.slice(-7);
    const first   = recent[0]?.listeners ?? 0;
    const last7   = recent[recent.length - 1]?.listeners ?? 0;
    const trend   = first > 0 ? ((last7 - first) / first * 100) : 0;
    if (trend >= 10) {
      insights.push({
        type: 'positive',
        icon: <TrendingUp size={14} />,
        title: `+${trend.toFixed(0)}% listeners this week`,
        body: `Daily listeners have grown significantly over the last 7 days. A good moment to push new content or run ads to capitalise on momentum.`,
      });
    } else if (trend <= -10) {
      insights.push({
        type: 'warning',
        icon: <ArrowDownRight size={14} />,
        title: `${trend.toFixed(0)}% listeners drop this week`,
        body: `Daily listeners declined in the last 7 days. Consider a social media push, playlist pitching, or releasing a new single to re-engage your audience.`,
      });
    }
  }

  // Saves ratio
  const saves   = Number(ov.saves ?? 0);
  const streams = Number(ov.streams ?? 0);
  if (streams > 0 && saves > 0) {
    const saveRate = saves / streams;
    if (saveRate >= 0.05) {
      insights.push({
        type: 'positive',
        icon: <Disc size={14} />,
        title: 'Strong save rate',
        body: `${(saveRate * 100).toFixed(1)}% of streams result in a save — well above average. Your music is resonating deeply with listeners.`,
      });
    }
  }

  // New listeners segment
  if (seg?.new_listeners > 0 && seg?.total_audience > 0) {
    const newPct = (seg.new_listeners / seg.total_audience * 100);
    if (newPct >= 30) {
      insights.push({
        type: 'positive',
        icon: <Target size={14} />,
        title: 'Strong audience growth',
        body: `${newPct.toFixed(0)}% of your audience are new listeners — discovery is working well. Make sure your profile and bio are optimised to convert them into followers.`,
      });
    }
  }

  // Top geography
  if (countries.length > 0) {
    const top = countries[0];
    insights.push({
      type: 'neutral',
      icon: <Globe size={14} />,
      title: `Top market: ${top.country}`,
      body: `${flag(top.iso)} ${top.country} leads with ${fmt(top.listeners)} listeners${top.pct_active ? ` and ${top.pct_active?.toFixed(1)}% active rate` : ''}. Consider localised content, press or live shows in this market.`,
    });
  }

  // Demographics tip
  if (demo) {
    const topAge = [
      { label: 'under 18', v: demo.pct_under18 },
      { label: '18–24',    v: demo.pct_18_24 },
      { label: '25–34',    v: demo.pct_25_34 },
      { label: '35–44',    v: demo.pct_35_44 },
      { label: '45–54',    v: demo.pct_45_54 },
    ].sort((a, b) => b.v - a.v)[0];

    if (topAge?.v > 0) {
      insights.push({
        type: 'neutral',
        icon: <Users size={14} />,
        title: `Core audience: ${topAge.label}`,
        body: `${topAge.v.toFixed(1)}% of your listeners are aged ${topAge.label}. Tailor your content strategy, platform choice, and visual identity to this demographic.`,
      });
    }
  }

  return insights.slice(0, 4);
}

/* ─── InsightsPanel ────────────────────────────────────────────────────────── */

function InsightsPanel({ data }: { data: any }) {
  const insights = buildInsights(data);

  const colors = {
    positive: { bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)', icon: '#34d399', badge: 'rgba(52,211,153,0.12)', badgeText: '#34d399' },
    warning:  { bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.18)',  icon: '#fbbf24', badge: 'rgba(251,191,36,0.12)',  badgeText: '#fbbf24' },
    neutral:  { bg: 'rgba(124,92,252,0.06)',  border: 'rgba(124,92,252,0.18)',  icon: '#a78bfa', badge: 'rgba(124,92,252,0.12)',  badgeText: '#a78bfa' },
  };

  if (insights.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(13,13,22,0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      padding: 24,
      backdropFilter: 'blur(16px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.5) 40%,rgba(52,211,153,0.4) 60%,transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={14} color="#a78bfa" />
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Insights & Recommendations
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {insights.map((ins, i) => {
          const c = colors[ins.type];
          return (
            <div key={i} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = '';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 7, background: c.badge, color: c.icon }}>
                  {ins.icon}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif", lineHeight: 1.3 }}>
                  {ins.title}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#9d9ab0', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, margin: 0 }}>
                {ins.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── KpiCard ──────────────────────────────────────────────────────────────── */

function KpiCard({ title, value, icon, change, sub }: {
  title: string; value: string; icon: React.ReactNode;
  change?: number; sub?: string;
}) {
  const pos = change != null ? change >= 0 : null;
  return (
    <div style={{
      position: 'relative', borderRadius: 18, padding: '22px 24px',
      background: 'rgba(13,13,22,0.7)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(16px)', overflow: 'hidden',
      transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s, box-shadow 0.22s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,92,252,0.3)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(124,92,252,0.1)', filter: 'blur(24px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>{title}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(124,92,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {change != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: pos ? '#34d399' : '#f87171', background: pos ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${pos ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`, borderRadius: 6, padding: '2px 7px' }}>
            {pos ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ─── Tooltip ──────────────────────────────────────────────────────────────── */

const renderTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  const date = label ? new Date(String(label)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '';
  return (
    <div style={{ background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', fontFamily: "'DM Sans',sans-serif" }}>
      <p style={{ fontSize: 11, color: '#7c7a8e', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{date}</p>
      {[...payload].map((p: any) => (
        <p key={String(p.dataKey)} style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif", margin: '2px 0' }}>
          <span style={{ color: p.color ?? '#a78bfa', marginRight: 6 }}>▲</span>
          {Number(p.value).toLocaleString('it-IT')}
          <span style={{ fontSize: 11, fontWeight: 400, color: '#7c7a8e', marginLeft: 4 }}>{p.dataKey}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Segments ─────────────────────────────────────────────────────────────── */

function SegmentsTab({ segments }: { segments: any }) {
  if (!segments) return <EmptyState label="No data about segments" />;
  const items = [
    { label: 'Total Audience',        value: segments.total_audience,        color: '#7c5cfc' },
    { label: 'New Listeners',         value: segments.new_listeners,         color: '#34d399' },
    { label: 'New Active Listeners',  value: segments.new_active_listeners,  color: '#a78bfa' },
    { label: 'Reactivated Listeners', value: segments.reactivated_listeners, color: '#f59e0b' },
  ];
  const max = Math.max(...items.map(i => i.value ?? 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map(item => (
        <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#f0eeff', fontFamily: "'Syne',sans-serif" }}>{fmt(item.value)}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${((item.value ?? 0) / max * 100).toFixed(0)}%`, background: item.color, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)', boxShadow: `0 0 10px ${item.color}66` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Location ─────────────────────────────────────────────────────────────── */

function LocationTab({ countries, cities }: { countries: any[]; cities: any[] }) {
  const [view, setView] = useState<'countries' | 'cities'>('countries');
  return (
    <div>
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 3, gap: 2, marginBottom: 20 }}>
        {(['countries', 'cities'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Syne',sans-serif", background: view === v ? '#7c5cfc' : 'transparent', color: view === v ? '#fff' : '#7c7a8e', transition: 'all 0.15s', boxShadow: view === v ? '0 2px 10px rgba(124,92,252,0.4)' : 'none' }}>
            {v === 'countries' ? 'Countries' : 'Cities'}
          </button>
        ))}
      </div>
      {view === 'countries' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {countries.length === 0 ? <EmptyState label="No data" /> : countries.map((c: any, i: number) => (
            <div key={c.country ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', width: 18, textAlign: 'center', fontFamily: "'Syne',sans-serif" }}>{i + 1}</span>
              <span style={{ fontSize: 16 }}>{flag(c.iso)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#f0eeff', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{c.country}</div>
                {c.pct_active > 0 && <div style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>{c.pct_active?.toFixed(1)}% active</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif" }}>{fmt(c.listeners)}</div>
                {c.active_listeners > 0 && <div style={{ fontSize: 11, color: '#34d399', fontFamily: "'DM Sans',sans-serif" }}>{fmt(c.active_listeners)} active</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cities.length === 0 ? <EmptyState label="No data" /> : cities.map((c: any, i: number) => (
            <div key={c.city ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', width: 18, textAlign: 'center', fontFamily: "'Syne',sans-serif" }}>{i + 1}</span>
              <MapPin size={14} color="#7c7a8e" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#f0eeff', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{c.city}</div>
                <div style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>{c.country}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif" }}>{fmt(c.listeners)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Demographics ─────────────────────────────────────────────────────────── */

function DemographicsTab({ demographics }: { demographics: any }) {
  if (!demographics) return <EmptyState label="No data" />;
  const genderData = [
    { label: 'Female',     value: demographics.pct_female ?? 0,       color: '#c084fc' },
    { label: 'Male',       value: demographics.pct_male ?? 0,         color: '#7c5cfc' },
    { label: 'Non-binary', value: demographics.pct_nonbinary ?? 0,    color: '#34d399' },
    { label: 'Non spec.',  value: demographics.pct_not_specified ?? 0, color: '#7c7a8e' },
  ];
  const ageData = [
    { label: '<18',   value: demographics.pct_under18 ?? 0 },
    { label: '18–24', value: demographics.pct_18_24 ?? 0 },
    { label: '25–34', value: demographics.pct_25_34 ?? 0 },
    { label: '35–44', value: demographics.pct_35_44 ?? 0 },
    { label: '45–54', value: demographics.pct_45_54 ?? 0 },
    { label: '55–64', value: demographics.pct_55_64 ?? 0 },
    { label: '65+',   value: demographics.pct_65_plus ?? 0 },
  ];
  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Listeners' gender</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {genderData.map(g => (
            <div key={g.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif" }}>{g.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: g.color, fontFamily: "'Syne',sans-serif" }}>{g.value.toFixed(1)}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${g.value}%`, background: g.color, boxShadow: `0 0 8px ${g.color}55`, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Listeners' Age</h4>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }} />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Percentuale']} contentStyle={{ background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {ageData.map((_, i) => <Cell key={i} fill={`rgba(124,92,252,${0.4 + i * 0.08})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      {label}
    </div>
  );
}

/* ─── Bottom Tabs ──────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'segments',     label: 'Segments',     icon: <PieChart size={14} /> },
  { id: 'locations',    label: 'Locations',    icon: <Globe size={14} /> },
  { id: 'demographics', label: 'Demographics', icon: <Users size={14} /> },
] as const;
type TabId = typeof TABS[number]['id'];

function BottomTabs({ data }: { data: any }) {
  const [active, setActive] = useState<TabId>('segments');
  return (
    <div style={{ background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent)' }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Syne',sans-serif", background: active === t.id ? '#7c5cfc' : 'transparent', color: active === t.id ? '#fff' : '#7c7a8e', transition: 'all 0.15s', boxShadow: active === t.id ? '0 2px 12px rgba(124,92,252,0.45)' : 'none' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {active === 'segments'     && <SegmentsTab     segments={data.segments} />}
      {active === 'locations'    && <LocationTab     countries={data.location_countries} cities={data.location_cities} />}
      {active === 'demographics' && <DemographicsTab demographics={data.demographics} />}
    </div>
  );
}

/* ─── KPI Grid ─────────────────────────────────────────────────────────────── */

function OverviewKpiGrid({ overview }: { overview: any }) {
  const ov = overview ?? {};
  return (
    <>
      <style>{`
        .kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(min-width:768px){ .kpi-grid{ grid-template-columns:repeat(4,1fr); } }
        @media(max-width:400px){ .kpi-grid{ grid-template-columns:1fr; } }
      `}</style>
      <div className="kpi-grid">
        <KpiCard title="Monthly Active Listeners" value={fmt(ov.monthly_active_listeners)} icon={<Users size={16} color="#a78bfa" />} />
        <KpiCard title="Total Streams"            value={fmt(ov.streams)}                  icon={<TrendingUp size={16} color="#a78bfa" />} />
        <KpiCard title="Playlist Adds"            value={fmt(ov.playlist_adds)}            icon={<ListMusic size={16} color="#a78bfa" />} />
        <KpiCard title="Saves"                    value={fmt(ov.saves)}                    icon={<Disc size={16} color="#a78bfa" />} sub={ov.streams_per_listener != null ? `${Number(ov.streams_per_listener).toFixed(1)} str/listener` : undefined} />
      </div>
      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <KpiCard title="Listeners"          value={fmt(ov.listeners)}          icon={<Users size={16} color="#a78bfa" />} />
        <KpiCard title="Followers"          value={fmt(ov.followers)}          icon={<TrendingUp size={16} color="#a78bfa" />} />
        <KpiCard title="Streams / Listener" value={ov.streams_per_listener != null ? Number(ov.streams_per_listener).toFixed(2) : '—'} icon={<ListMusic size={16} color="#a78bfa" />} />
      </div>
    </>
  );
}

/* ─── Header ───────────────────────────────────────────────────────────────── */

function DashboardHeader({ artist, onRefresh, refreshing, lastUpdated }: {
  artist: any;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date | null;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-EN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const lastStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        .live-dot { width:7px;height:7px;border-radius:50%;background:#34d399;animation:live-pulse 2s ease-in-out infinite; }
        @keyframes live-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0)} }
        @keyframes fadeUp{ from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin{ to{transform:rotate(360deg)} }
        @keyframes pulse-opacity{ 0%,100%{opacity:0.4} 50%{opacity:1} }
        .dash-section{ animation:fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .dash-s1{animation-delay:0s} .dash-s2{animation-delay:0.07s} .dash-s3{animation-delay:0.14s} .dash-s4{animation-delay:0.21s}
        .refresh-btn { display:flex; align-items:center; gap:7px; padding:8px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#c4c0d8; font-size:12px; font-weight:600; font-family:'Syne',sans-serif; cursor:pointer; transition:all 0.18s cubic-bezier(0.22,1,0.36,1); }
        .refresh-btn:hover { background:rgba(124,92,252,0.12); border-color:rgba(124,92,252,0.3); color:#f0eeff; }
        .refresh-btn:active { transform:scale(0.96); }
        .refresh-icon-spin { animation: spin 0.7s linear infinite; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
                {artist ? `Hello, ${artist.name}` : 'Dashboard'}
              </h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <div className="live-dot" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", fontWeight: 300, margin: 0 }}>
              Detailed analytics about your performances · {dateStr}
            </p>
          </div>

          {/* Refresh button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastStr && (
              <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>
                Updated at {lastStr}
              </span>
            )}
            <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? 'refresh-icon-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(124,92,252,0.3),rgba(255,255,255,0.05) 60%,transparent)' }} />
      </div>
    </>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */

export default function DashboardHome() {
  const { currentArtist } = useArtist();
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback((isRefresh = false) => {
    if (!currentArtist) return;
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); setData(null); }

    fetchArtistStats(currentArtist.id)
      .then(d => { setData(d); setLastUpdated(new Date()); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [currentArtist]);

  useEffect(() => { load(false); }, [load]);

  if (!currentArtist) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="rgba(124,92,252,0.6)" />
        </div>
        <p style={{ fontSize: 14, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>Seleziona un artista per visualizzare le analytics</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", animation: 'pulse-opacity 1.5s ease-in-out infinite' }}>Loading analytics…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="dash-section dash-s1">
        <DashboardHeader
          artist={currentArtist}
          onRefresh={() => load(true)}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
        />
      </div>
      <div className="dash-section dash-s2"><OverviewKpiGrid overview={data.overview} /></div>
      <div className="dash-section dash-s3"><InsightsPanel data={data} /></div>
      <div className="dash-section dash-s4"><BottomTabs data={data} /></div>
    </div>
  );
}