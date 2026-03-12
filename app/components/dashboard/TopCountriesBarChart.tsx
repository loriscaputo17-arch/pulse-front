'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

/* ── Country flag emoji helper ── */
function countryFlag(iso: string) {
  if (!iso || iso.length !== 2) return '🌍';
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

/* ── Custom tooltip — no Recharts types, render-function pattern ── */
interface TooltipEntry { paese?: string; listeners?: number; }
interface CustomTooltipProps {
  active?:  boolean;
  payload?: readonly { payload?: TooltipEntry }[] | { payload?: TooltipEntry }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload ?? {};
  return (
    <div style={{
      background: 'rgba(13,13,22,0.95)',
      border: '1px solid rgba(124,92,252,0.3)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ fontSize: 12, color: '#f0eeff', fontWeight: 600, marginBottom: 4 }}>{d.paese}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', fontFamily: "'Syne', sans-serif", margin: 0 }}>
        {Number(d.listeners).toLocaleString('it-IT')}
        <span style={{ fontSize: 11, fontWeight: 400, color: '#7c7a8e', marginLeft: 4 }}>listeners</span>
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderTooltip = (props: any) => <CustomTooltip {...props} />;

export default function TopCountriesBarChart({ data = [] }: { data: any[] }) {
  const top = data.slice(0, 8);
  const max = Math.max(...top.map((d: any) => d.listeners ?? 0), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400&display=swap');
        .countries-card {
          background: rgba(13,13,22,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(16px);
          position: relative;
          overflow: hidden;
        }
        .countries-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5) 40%, rgba(167,139,250,0.5) 60%, transparent);
        }
        .country-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 8px;
          padding: 8px 6px;
          margin: 0 -6px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .country-row:last-child { border-bottom: none; }
        .country-row:hover { background: rgba(124,92,252,0.06); }
        .country-bar-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .country-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1s cubic-bezier(0.22,1,0.36,1);
        }
      `}</style>

      <div className="countries-card">
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.02em', margin: 0 }}>
            Top Countries
          </h3>
          <p style={{ fontSize: 12, color: '#7c7a8e', margin: '3px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Listeners per paese
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {top.map((d: any, i: number) => {
            const pct = ((d.listeners ?? 0) / max * 100).toFixed(0);
            const gradient = i === 0
              ? 'linear-gradient(90deg, #7c5cfc, #c084fc)'
              : i === 1
              ? 'linear-gradient(90deg, #7c5cfc, #a78bfa)'
              : 'linear-gradient(90deg, rgba(124,92,252,0.8), rgba(124,92,252,0.5))';

            return (
              <div key={d.paese ?? i} className="country-row">
                <span style={{ fontSize: 10, fontWeight: 700, color: i < 3 ? '#a78bfa' : '#7c7a8e', width: 16, textAlign: 'center', flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
                  {i + 1}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: 110, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{countryFlag(d.iso ?? d.paese?.slice(0, 2) ?? '')}</span>
                  <span style={{ fontSize: 12, color: '#c4c0d8', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.paese}
                  </span>
                </div>

                <div className="country-bar-track">
                  <div className="country-bar-fill" style={{ width: `${pct}%`, background: gradient }} />
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, color: '#f0eeff', fontFamily: "'Syne', sans-serif", minWidth: 42, textAlign: 'right', flexShrink: 0 }}>
                  {d.listeners >= 1000
                    ? `${(d.listeners / 1000).toFixed(1)}k`
                    : d.listeners?.toLocaleString('it-IT') ?? 0}
                </span>
              </div>
            );
          })}
        </div>

        {top.length === 0 && (
          <p style={{ fontSize: 12, color: '#7c7a8e', textAlign: 'center', padding: '20px 0', fontFamily: "'DM Sans', sans-serif" }}>
            Nessun dato disponibile
          </p>
        )}
      </div>
    </>
  );
}