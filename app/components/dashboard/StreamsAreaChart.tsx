'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/* ─────────────────────────────────────────────
   Recharts tooltip types are notoriously broken
   across versions. Using a plain interface keyed
   off what Recharts actually passes at runtime.
───────────────────────────────────────────── */
interface TooltipEntry {
  dataKey?: string | number;
  value?:   number;
  name?:    string;
  color?:   string;
}

interface CustomTooltipProps {
  active?:  boolean;
  // Recharts passes readonly – we accept both
  payload?: readonly TooltipEntry[] | TooltipEntry[];
  label?:   string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const date = label
    ? new Date(String(label)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div style={{
      background: 'rgba(13,13,22,0.95)',
      border: '1px solid rgba(124,92,252,0.3)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ fontSize: 11, color: '#7c7a8e', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {date}
      </p>
      {[...payload].map(p => (
        <p key={String(p.dataKey)} style={{ fontSize: 14, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne', sans-serif", margin: 0 }}>
          <span style={{ color: p.color ?? '#a78bfa', marginRight: 6 }}>▲</span>
          {Number(p.value).toLocaleString('it-IT')}
          <span style={{ fontSize: 11, fontWeight: 400, color: '#7c7a8e', marginLeft: 4 }}>
            {String(p.dataKey)}
          </span>
        </p>
      ))}
    </div>
  );
}

/* Wrapper so we never pass a JSX element directly to `content`
   (that's what triggers the "missing required props" TS error).
   Instead we pass a render function — Recharts accepts both. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderTooltip = (props: any) => <CustomTooltip {...props} />;

export default function StreamsAreaChart({ data }: { data: any[] }) {
  const safeData = data ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400&display=swap');
        .streams-card {
          background: rgba(13,13,22,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px 24px 20px;
          backdrop-filter: blur(16px);
          position: relative;
          overflow: hidden;
        }
        .streams-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5) 40%, rgba(167,139,250,0.5) 60%, transparent);
        }
        .recharts-cartesian-axis-tick-value {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 11px !important;
          fill: #7c7a8e !important;
        }
      `}</style>

      <div className="streams-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', margin: 0 }}>
              Streaming Trend
            </h3>
            <p style={{ fontSize: 12, color: '#7c7a8e', margin: '3px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
              Andamento giornaliero degli stream
            </p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em' }}>LIVE</span>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 280, marginLeft: -8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#7c5cfc" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={d => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)}
                tick={{ fontSize: 11, fill: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}
                width={36}
              />

              <Tooltip
                content={renderTooltip}
                cursor={{ stroke: 'rgba(124,92,252,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />

              <Area type="monotone" dataKey="streams"   stroke="#7c5cfc" strokeWidth={2.5} fill="url(#streamGrad)"   dot={false} activeDot={{ r: 4, fill: '#7c5cfc', stroke: '#f0eeff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="listeners" stroke="#34d399" strokeWidth={1.5} fill="url(#listenerGrad)" dot={false} activeDot={{ r: 4, fill: '#34d399', stroke: '#f0eeff', strokeWidth: 2 }} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingLeft: 8 }}>
          {[
            { color: '#7c5cfc', label: 'Streams',  dashed: false },
            { color: '#34d399', label: 'Listeners', dashed: true  },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: l.dashed ? 'none' : l.color, borderRadius: 1, borderTop: l.dashed ? `2px dashed ${l.color}` : undefined, opacity: l.dashed ? 0.7 : 1 }} />
              <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}