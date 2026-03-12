'use client';
import { useArtist } from '../../context/ArtistContext';

export default function DashboardHeader() {
  const { currentArtist } = useArtist?.() ?? {};

  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        .header-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .header-wrap {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 0 0 rgba(52,211,153,0.4);
          animation: live-pulse 2s ease-in-out infinite;
        }
        @keyframes live-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
        }
      `}</style>

      <div className="header-wrap">
        {/* Left: title + subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(20px, 3vw, 26px)',
              fontWeight: 800,
              color: '#f0eeff',
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              {currentArtist ? `Ciao, ${currentArtist.name}` : 'Dashboard'}
            </h2>
            {/* Live badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 100,
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
            }}>
              <div className="live-dot" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>
            </div>
          </div>
          <p style={{
            fontSize: 13, color: '#7c7a8e',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300, margin: 0,
          }}>
            Analisi dettagliata delle tue performance musicali · {dateStr}
          </p>
        </div>

        {/* Right: time range selector */}
        <TimeRangeSelector />
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        marginTop: 20,
        background: 'linear-gradient(90deg, rgba(124,92,252,0.3), rgba(255,255,255,0.05) 60%, transparent)',
      }} />
    </>
  );
}

function TimeRangeSelector() {
  const ranges = ['7D', '30D', '90D', '1Y'];
  const [active, setActive] = (typeof window !== 'undefined'
    ? require('react') : { useState: (v: any) => [v, () => {}] }
  ).useState('30D');

  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: 3,
      gap: 2,
      alignSelf: 'flex-start',
    }}>
      {ranges.map(r => (
        <button
          key={r}
          onClick={() => setActive(r)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '0.03em',
            transition: 'all 0.15s',
            background: active === r ? '#7c5cfc' : 'transparent',
            color: active === r ? '#fff' : '#7c7a8e',
            boxShadow: active === r ? '0 2px 10px rgba(124,92,252,0.4)' : 'none',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}