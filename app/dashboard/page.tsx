'use client';
import { useEffect, useState } from 'react';
import { useArtist } from '../context/ArtistContext';
import { getArtistStats } from '../../lib/api';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiGrid from '../components/dashboard/KpiGrid';
import StreamsAreaChart from '../components/dashboard/StreamsAreaChart';
import TopCountriesBarChart from '../components/dashboard/TopCountriesBarChart';

export default function DashboardHome() {
  const { currentArtist } = useArtist();   // 👈 QUI
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentArtist) return;

    setLoading(true);
    getArtistStats(currentArtist.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [currentArtist]);

  if (!currentArtist) {
    return <div className="text-zinc-500">Select an artist</div>;
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-violet-500">
        <div className="animate-pulse font-medium">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <KpiGrid data={data} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <StreamsAreaChart data={data?.daily_chart} />
        <TopCountriesBarChart data={data?.top_countries} />
      </div>
    </div>
  );
}
