'use client';
import { useEffect, useState } from 'react';
import { getTrackStats } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, TrendingUp, Disc, Globe } from 'lucide-react';

export default function DashboardHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrackStats(1)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-green-500">Loading metrics...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Panoramica</h2>
        <p className="text-gray-400">Bentornato, ecco i dati delle tue ultime release.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Total Streams" value={data?.daily_chart.reduce((acc:any, curr:any) => acc + curr.streams, 0).toLocaleString()} icon={<TrendingUp className="text-green-500"/>} />
        <KpiCard title="Avg. Listeners" value="12,450" icon={<Users className="text-blue-500"/>} />
        <KpiCard title="Saves" value={data?.daily_chart[data.daily_chart.length -1]?.saves || '0'} icon={<Disc className="text-purple-500"/>} />
        <KpiCard title="Top Region" value={data?.top_countries[0]?.paese || 'N/A'} icon={<Globe className="text-orange-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LINE CHART - STREAMS OVER TIME */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Streaming Trend (Daily)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tickFormatter={(str: any) => new Date(str).toLocaleDateString()} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none'}} />
                <Line type="monotone" dataKey="streams" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART - TOP COUNTRIES */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_countries}>
                <XAxis dataKey="paese" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none'}} />
                <Bar dataKey="streams" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400 uppercase font-semibold">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="bg-gray-900 p-3 rounded-lg">
        {icon}
      </div>
    </div>
  );
}