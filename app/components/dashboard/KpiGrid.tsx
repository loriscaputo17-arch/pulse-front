'use client';
import { TrendingUp, Users, Disc, Globe } from 'lucide-react';
import KpiCard from './KpiCard';

export default function KpiGrid({ data }: any) {
  const daily = data?.daily_chart ?? [];
  const total_saves = data?.total_saves ?? [];
  const countries = data?.top_countries ?? [];

  const totals = daily.reduce(
    (acc: any, cur: any) => {
      acc.listeners += cur.listeners ?? 0;
      acc.streams += cur.streams ?? 0;
      acc.saves += cur.saves ?? 0;
      return acc;
    },
    { listeners: 0, streams: 0, saves: 0 }
  );

  const lastDay = daily.length > 0 ? daily[daily.length - 1] : null;
  const totalFollowers = lastDay?.followers ?? 0;
  const topCountry = countries.length > 0 ? countries[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        title="Total Listeners"
        value={totals.listeners.toLocaleString()}
        icon={<Users className="text-violet-400" />}
      />

      <KpiCard
        title="Total Streams"
        value={totals.streams.toLocaleString()}
        icon={<TrendingUp className="text-violet-400" />}
      />

      <KpiCard
        title="Followers"
        value={totalFollowers.toLocaleString()}
        icon={<Globe className="text-violet-400" />}
      />

      <KpiCard
        title="Total Saves"
        value={total_saves.toLocaleString()}
        icon={<Disc className="text-violet-400" />}
      />
    </div>
  );
}
