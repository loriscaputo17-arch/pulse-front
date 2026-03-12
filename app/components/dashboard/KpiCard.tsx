'use client';
import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: number;   // e.g. +12.4 or -3.2
  sub?: string;      // optional subtitle
}

export default function KpiCard({ title, value, icon, change, sub }: KpiCardProps) {
  const isPositive = change !== undefined ? change >= 0 : null;

  return (
    <>
      <style>{`
        .kpi-card {
          position: relative;
          border-radius: 18px;
          padding: 22px 24px;
          background: rgba(13,13,22,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), border-color 0.22s, box-shadow 0.22s;
          cursor: default;
        }
        .kpi-card:hover {
          transform: translateY(-3px);
          border-color: rgba(124,92,252,0.3);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,92,252,0.1);
        }
        .kpi-card:hover .kpi-icon-wrap {
          background: rgba(124,92,252,0.22);
          box-shadow: 0 0 18px rgba(124,92,252,0.3);
        }
        .kpi-icon-wrap {
          transition: background 0.22s, box-shadow 0.22s;
        }
      `}</style>

      <div className="kpi-card">
        {/* Corner glow */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(124,92,252,0.1)', filter: 'blur(24px)',
          pointerEvents: 'none',
        }} />

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: '#7c7a8e',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {title}
          </span>
          <div className="kpi-icon-wrap" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(124,92,252,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        </div>

        {/* Value */}
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 800,
          color: '#f0eeff',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 10,
        }}>
          {value}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {change !== undefined && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 700,
              color: isPositive ? '#34d399' : '#f87171',
              background: isPositive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${isPositive ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              borderRadius: 6, padding: '2px 7px',
            }}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
          {sub && (
            <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}>
              {sub}
            </span>
          )}
          {!change && !sub && (
            <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans', sans-serif" }}>
              ultimi 30 giorni
            </span>
          )}
        </div>
      </div>
    </>
  );
}