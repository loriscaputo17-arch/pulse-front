'use client';
import { TrendingUp, Users, Disc, Globe } from 'lucide-react';
import KpiCard from './KpiCard';

export default function KpiGrid({ data }: any) {
  const daily        = data?.daily_chart   ?? [];
  const total_saves  = data?.total_saves   ?? 0;
  const countries    = data?.top_countries ?? [];

  const totals = daily.reduce(
    (acc: any, cur: any) => {
      acc.listeners += cur.listeners ?? 0;
      acc.streams   += cur.streams   ?? 0;
      return acc;
    },
    { listeners: 0, streams: 0 }
  );

  const lastDay        = daily.length > 0 ? daily[daily.length - 1]  : null;
  const prevDay        = daily.length > 1 ? daily[daily.length - 2]  : null;
  const totalFollowers = lastDay?.followers ?? 0;

  const pctChange = (cur: number, prev: number) =>
    prev > 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(1)) : undefined;

  const streamChange   = pctChange(lastDay?.streams   ?? 0, prevDay?.streams   ?? 0);
  const listenerChange = pctChange(lastDay?.listeners ?? 0, prevDay?.listeners ?? 0);

  return (
    <>
      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 400px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="kpi-grid">
        <KpiCard
          title="Total Listeners"
          value={totals.listeners.toLocaleString('it-IT')}
          icon={<Users size={16} color="#a78bfa" />}
          change={listenerChange}
        />
        <KpiCard
          title="Total Streams"
          value={totals.streams.toLocaleString('it-IT')}
          icon={<TrendingUp size={16} color="#a78bfa" />}
          change={streamChange}
        />
        <KpiCard
          title="Followers"
          value={totalFollowers.toLocaleString('it-IT')}
          icon={<Globe size={16} color="#a78bfa" />}
          sub={countries[0]?.paese ? `Top: ${countries[0].paese}` : undefined}
        />
        <KpiCard
          title="Total Saves"
          value={Number(total_saves).toLocaleString('it-IT')}
          icon={<Disc size={16} color="#a78bfa" />}
        />
      </div>
    </>
  );
}