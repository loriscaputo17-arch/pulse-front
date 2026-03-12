'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useArtist } from '../../context/ArtistContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Sparkles, TrendingUp, TrendingDown, Zap, Target,
  AlertCircle, Globe, Users, Disc, ListMusic,
  BarChart2, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';

/* ─── Fetch ──────────────────────────────────────────────────────────────── */

async function fetchInsightData(artistId: string) {
  const [
    { data: overview },
    { data: daily },
    { data: segments },
    { data: demographics },
    { data: countries },
  ] = await Promise.all([
    supabase.from('artist_overview').select('*').eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('artist_overview_daily')
      .select('date,listeners,streams,saves,playlist_adds,followers,streams_per_listener,monthly_active_listeners')
      .eq('artist_id', artistId).order('date', { ascending: true }),
    supabase.from('artist_segments').select('*').eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('artist_demographics').select('*').eq('artist_id', artistId)
      .order('uploaded_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('artist_location_countries')
      .select('rank,country,iso,listeners,pct_active,active_listeners')
      .eq('artist_id', artistId)
      .order('snapshot_date', { ascending: false }).order('rank', { ascending: true }).limit(5),
  ]);
  return {
    overview:     overview ?? null,
    daily:        daily ?? [],
    segments:     segments ?? null,
    demographics: demographics ?? null,
    countries:    countries ?? [],
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

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

function trendPct(arr: any[], key: string, days = 7) {
  if (arr.length < days + 1) return null;
  const slice = arr.slice(-days);
  const first = slice[0]?.[key] ?? 0;
  const last  = slice[slice.length - 1]?.[key] ?? 0;
  if (!first) return null;
  return parseFloat(((last - first) / first * 100).toFixed(1));
}

type Insight = {
  id:       string;
  category: string;
  type:     'positive' | 'warning' | 'neutral' | 'critical';
  icon:     React.ReactNode;
  title:    string;
  body:     string;
  metric?:  { label: string; value: string };
  chartKey?: string;
};

function buildInsights(d: any): Insight[] {
  const ins: Insight[] = [];
  const ov   = d.overview ?? {};
  const daily: any[] = d.daily ?? [];
  const seg  = d.segments;
  const demo = d.demographics;
  const ctrs: any[] = d.countries ?? [];

  /* ── Engagement ── */
  const spl = Number(ov.streams_per_listener ?? 0);
  if (spl >= 3) {
    ins.push({ id: 'spl-high', category: 'Engagement', type: 'positive', icon: <Zap size={15}/>, title: 'Exceptional repeat listening', body: `Your streams/listener ratio is ${spl.toFixed(2)}, well above average. Listeners are returning to your catalogue repeatedly — a strong signal of genuine fan engagement. Capitalize by releasing variations, live versions, or remixes.`, metric: { label: 'Streams / Listener', value: spl.toFixed(2) } });
  } else if (spl > 0 && spl < 1.5) {
    ins.push({ id: 'spl-low', category: 'Engagement', type: 'warning', icon: <AlertCircle size={15}/>, title: 'Low repeat listening rate', body: `At ${spl.toFixed(2)} streams per listener, most people are not coming back. Consider promoting deeper catalogue tracks, creating themed playlists, or releasing content that builds narrative continuity.`, metric: { label: 'Streams / Listener', value: spl.toFixed(2) } });
  }

  /* ── Listener trend ── */
  const listenerTrend = trendPct(daily, 'listeners', 7);
  if (listenerTrend != null) {
    if (listenerTrend >= 10) {
      ins.push({ id: 'listener-up', category: 'Growth', type: 'positive', icon: <TrendingUp size={15}/>, title: `+${listenerTrend}% listeners this week`, body: `Daily listeners have grown significantly in the last 7 days. This is a prime window to push ads, pitch to playlists, or release a new single to lock in this momentum.`, metric: { label: '7-day trend', value: `+${listenerTrend}%` }, chartKey: 'listeners' });
    } else if (listenerTrend <= -10) {
      ins.push({ id: 'listener-down', category: 'Growth', type: 'critical', icon: <TrendingDown size={15}/>, title: `${listenerTrend}% listener drop this week`, body: `Daily listeners have fallen over the past 7 days. A social media push, playlist re-pitching, or a new release can help reverse the trend before it becomes a longer slide.`, metric: { label: '7-day trend', value: `${listenerTrend}%` }, chartKey: 'listeners' });
    }
  }

  /* ── Saves rate ── */
  const saves   = Number(ov.saves   ?? 0);
  const streams = Number(ov.streams ?? 0);
  if (streams > 0 && saves > 0) {
    const sr = saves / streams;
    if (sr >= 0.05) {
      ins.push({ id: 'saves-high', category: 'Engagement', type: 'positive', icon: <Disc size={15}/>, title: 'Strong save rate', body: `${(sr * 100).toFixed(1)}% of streams result in a save — well above typical benchmarks (~2–3%). Your music is resonating deeply. Saving behavior strongly correlates with long-term streaming retention.`, metric: { label: 'Save rate', value: `${(sr * 100).toFixed(1)}%` } });
    } else if (sr < 0.01 && streams > 1000) {
      ins.push({ id: 'saves-low', category: 'Engagement', type: 'warning', icon: <AlertCircle size={15}/>, title: 'Very low save rate', body: `Only ${(sr * 100).toFixed(2)}% of streams convert into saves. This can limit algorithmic exposure (Spotify uses saves as a quality signal). Encourage listeners to save tracks in your social content.`, metric: { label: 'Save rate', value: `${(sr * 100).toFixed(2)}%` } });
    }
  }

  /* ── Playlist adds ── */
  const plAdds = Number(ov.playlist_adds ?? 0);
  if (plAdds > 0 && streams > 0) {
    const plRate = plAdds / streams;
    if (plRate >= 0.04) {
      ins.push({ id: 'pl-high', category: 'Discovery', type: 'positive', icon: <ListMusic size={15}/>, title: 'High playlist conversion', body: `${(plRate * 100).toFixed(1)}% of streams are converting into playlist adds — this is excellent. Playlists are your main discovery engine. Keep pitching to editorial and independent curators.`, metric: { label: 'Playlist add rate', value: `${(plRate * 100).toFixed(1)}%` } });
    }
  }

  /* ── New listeners ── */
  if (seg?.new_listeners > 0 && seg?.total_audience > 0) {
    const np = (seg.new_listeners / seg.total_audience * 100);
    if (np >= 30) {
      ins.push({ id: 'new-listeners', category: 'Growth', type: 'positive', icon: <Target size={15}/>, title: `${np.toFixed(0)}% new audience this period`, body: `A large portion of your audience are first-time listeners. Discovery is working. Make sure your Spotify profile, bio, and artist pick are optimised to turn new visitors into long-term followers.`, metric: { label: 'New listeners', value: `${np.toFixed(0)}%` } });
    } else if (np < 10 && seg.total_audience > 500) {
      ins.push({ id: 'stale-audience', category: 'Growth', type: 'neutral', icon: <Minus size={15}/>, title: 'Audience growth slowing', body: `Only ${np.toFixed(0)}% of your listeners are new this period. Your existing fanbase is engaged, but discovery is limited. Prioritise playlist pitching, collaborations, or paid social campaigns to reach new ears.`, metric: { label: 'New listeners', value: `${np.toFixed(0)}%` } });
    }
  }

  /* ── Top market ── */
  if (ctrs.length > 0) {
    const top = ctrs[0];
    ins.push({ id: 'top-market', category: 'Audience', type: 'neutral', icon: <Globe size={15}/>, title: `Top market: ${top.country}`, body: `${flag(top.iso)} ${top.country} leads with ${fmt(top.listeners)} listeners${top.pct_active ? ` and a ${top.pct_active?.toFixed(1)}% active listener rate` : ''}. If you haven't already, consider localised content, press outreach, or live dates in this market.`, metric: { label: 'Top country listeners', value: fmt(top.listeners) } });
  }

  /* ── Demographics ── */
  if (demo) {
    const ages = [
      { label: 'under 18', v: demo.pct_under18 },
      { label: '18–24',    v: demo.pct_18_24 },
      { label: '25–34',    v: demo.pct_25_34 },
      { label: '35–44',    v: demo.pct_35_44 },
      { label: '45–54',    v: demo.pct_45_54 },
    ].sort((a, b) => b.v - a.v);

    const top = ages[0];
    if (top?.v > 0) {
      ins.push({ id: 'demo-age', category: 'Audience', type: 'neutral', icon: <Users size={15}/>, title: `Core demographic: ${top.label}`, body: `${top.v.toFixed(1)}% of your listeners are aged ${top.label}. Align your visual identity, platform choice, and content cadence to this group — they are the most likely to convert into superfans and purchasers.`, metric: { label: 'Core age group', value: `${top.v.toFixed(1)}%` } });
    }

    const femPct = demo.pct_female ?? 0;
    const malPct = demo.pct_male   ?? 0;
    if (Math.abs(femPct - malPct) < 10 && femPct + malPct > 50) {
      ins.push({ id: 'demo-gender', category: 'Audience', type: 'neutral', icon: <Users size={15}/>, title: 'Balanced gender audience', body: `Your audience is almost equally split between female (${femPct.toFixed(0)}%) and male (${malPct.toFixed(0)}%) listeners. This is relatively rare and gives you flexibility in how you communicate and market your music.`, metric: { label: 'F / M split', value: `${femPct.toFixed(0)}% / ${malPct.toFixed(0)}%` } });
    }
  }

  /* ── Followers trend ── */
  const followerTrend = trendPct(daily, 'followers', 14);
  if (followerTrend != null && followerTrend >= 5) {
    ins.push({ id: 'followers-up', category: 'Growth', type: 'positive', icon: <ArrowUpRight size={15}/>, title: `+${followerTrend}% follower growth (14d)`, body: `Your follower count is growing steadily over the last two weeks. Followers receive automatic release alerts — growing this number compounds your future release reach significantly.`, metric: { label: '14-day growth', value: `+${followerTrend}%` }, chartKey: 'followers' });
  }

  return ins;
}

/* ─── Sparkline ──────────────────────────────────────────────────────────── */

function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  const slice = data.slice(-30);
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={slice} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#sg-${dataKey})`} dot={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: 'rgba(13,13,22,0.95)', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#f0eeff', fontFamily: "'DM Sans',sans-serif" }}>
                {fmt(payload[0]?.value as number)}
              </div>
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── InsightCard ────────────────────────────────────────────────────────── */

const TYPE_STYLES = {
  positive: { border: 'rgba(52,211,153,0.2)',  bg: 'rgba(52,211,153,0.05)',  icon: '#34d399', tag: 'rgba(52,211,153,0.12)',  tagText: '#34d399',  label: 'Positive'  },
  warning:  { border: 'rgba(251,191,36,0.22)', bg: 'rgba(251,191,36,0.05)', icon: '#fbbf24', tag: 'rgba(251,191,36,0.12)',  tagText: '#fbbf24',  label: 'Watch'     },
  neutral:  { border: 'rgba(124,92,252,0.2)',  bg: 'rgba(124,92,252,0.04)', icon: '#a78bfa', tag: 'rgba(124,92,252,0.12)',  tagText: '#a78bfa',  label: 'Info'      },
  critical: { border: 'rgba(248,113,113,0.22)',bg: 'rgba(248,113,113,0.05)',icon: '#f87171', tag: 'rgba(248,113,113,0.12)', tagText: '#f87171',  label: 'Alert'     },
};

const CHART_COLORS: Record<string, string> = {
  listeners: '#a78bfa',
  streams:   '#34d399',
  followers: '#fbbf24',
  saves:     '#60a5fa',
};

function InsightCard({ ins, daily }: { ins: Insight; daily: any[] }) {
  const s = TYPE_STYLES[ins.type];
  const chartColor = ins.chartKey ? (CHART_COLORS[ins.chartKey] ?? '#a78bfa') : null;

  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 36px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: s.tag, color: s.icon, flexShrink: 0 }}>
            {ins.icon}
          </span>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.tagText, fontFamily: "'DM Sans',sans-serif", marginBottom: 2 }}>
              {ins.category}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne',sans-serif", lineHeight: 1.3 }}>
              {ins.title}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: s.tag, color: s.tagText, border: `1px solid ${s.border}`, flexShrink: 0, marginTop: 2 }}>
          {s.label}
        </span>
      </div>

      {/* body */}
      <p style={{ fontSize: 12.5, color: '#9d9ab0', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7, margin: 0 }}>
        {ins.body}
      </p>

      {/* metric pill + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        {ins.metric && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 14px' }}>
            <div style={{ fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", marginBottom: 3 }}>{ins.metric.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.icon, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.04em' }}>{ins.metric.value}</div>
          </div>
        )}
        {ins.chartKey && chartColor && daily.length > 0 && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Sparkline data={daily} dataKey={ins.chartKey} color={chartColor} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Score Widget ───────────────────────────────────────────────────────── */

function HealthScore({ insights }: { insights: Insight[] }) {
  const pos      = insights.filter(i => i.type === 'positive').length;
  const critical = insights.filter(i => i.type === 'critical').length;
  const warning  = insights.filter(i => i.type === 'warning').length;
  const total    = insights.length || 1;
  const score    = Math.round(((pos * 1 + (total - critical - warning) * 0.5) / total) * 100);

  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Needs attention' : 'Underperforming';

  const circumference = 2 * Math.PI * 38;
  const strokeDash = (score / 100) * circumference;

  return (
    <div style={{ background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 28px', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      {/* ring */}
      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>score</span>
        </div>
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f0eeff', fontFamily: "'Syne',sans-serif", letterSpacing: '-0.03em', marginBottom: 6 }}>
          Artist Health Score
        </div>
        <div style={{ fontSize: 13, color, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>{label}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Positive', count: pos,      color: '#34d399' },
            { label: 'Watch',    count: warning,   color: '#fbbf24' },
            { label: 'Alert',    count: critical,  color: '#f87171' },
          ].map(b => (
            <span key={b.label} style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", padding: '3px 10px', borderRadius: 7, background: `rgba(${b.color === '#34d399' ? '52,211,153' : b.color === '#fbbf24' ? '251,191,36' : '248,113,113'},0.1)`, color: b.color, border: `1px solid ${b.color}44` }}>
              {b.count} {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Category Filter ────────────────────────────────────────────────────── */

const ALL_CATEGORIES = ['All', 'Growth', 'Engagement', 'Discovery', 'Audience'];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function InsightsPage() {
  const { currentArtist } = useArtist();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState('All');

  useEffect(() => {
    if (!currentArtist) return;
    setLoading(true);
    setData(null);
    fetchInsightData(currentArtist.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [currentArtist]);

  if (!currentArtist) return (
    <Empty label="Select an artist to view insights" />
  );

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>Analysing your data…</p>
    </div>
  );

  const insights = buildInsights(data);
  const filtered = filter === 'All' ? insights : insights.filter(i => i.category === filter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes fadeUp{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin{ to{transform:rotate(360deg)} }
        .ins-section{ animation:fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .ins-s1{animation-delay:0s} .ins-s2{animation-delay:0.06s} .ins-s3{animation-delay:0.12s}
        .filter-btn { padding:6px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:#7c7a8e; font-size:12px; font-weight:600; font-family:'Syne',sans-serif; cursor:pointer; transition:all 0.15s; }
        .filter-btn:hover { border-color:rgba(124,92,252,0.3); color:#c4c0d8; background:rgba(124,92,252,0.06); }
        .filter-btn.active { background:#7c5cfc; border-color:#7c5cfc; color:#fff; box-shadow:0 2px 12px rgba(124,92,252,0.4); }
        .ins-grid { display:grid; gap:16px; grid-template-columns:1fr; }
        @media(min-width:760px){ .ins-grid{ grid-template-columns:1fr 1fr; } }
        @media(min-width:1200px){ .ins-grid{ grid-template-columns:1fr 1fr 1fr; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div className="ins-section ins-s1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#a78bfa" />
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
              Insights
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
            Automated recommendations based on your latest Spotify data
          </p>
          <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(124,92,252,0.3),rgba(255,255,255,0.05) 60%,transparent)', marginTop: 8 }} />
        </div>

        {/* Health score */}
        <div className="ins-section ins-s2">
          <HealthScore insights={insights} />
        </div>

        {/* Filters */}
        <div className="ins-section ins-s2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map(cat => (
            <button key={cat} className={`filter-btn${filter === cat ? ' active' : ''}`} onClick={() => setFilter(cat)}>
              {cat}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", alignSelf: 'center' }}>
            {filtered.length} insight{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cards */}
        <div className="ins-section ins-s3">
          {filtered.length === 0 ? (
            <Empty label="No insights available for this category yet" />
          ) : (
            <div className="ins-grid">
              {filtered.map(ins => (
                <InsightCard key={ins.id} ins={ins} daily={data.daily} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      {label}
    </div>
  );
}