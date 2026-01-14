'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  TrendingUp,
  Users,
  Bookmark,
  ListMusic
} from 'lucide-react';
import { useArtist } from '../../../context/ArtistContext';
import TrackDailyChart from '../../../components/dashboard/TrackDailyChart';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TrackDetailPage() {
  const { id } = useParams(); // track_id
    const { currentArtist } = useArtist();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentArtist) return;

    fetch(`${API_BASE}/artists/${currentArtist.id}/tracks/${id}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-zinc-400">Loading track…</div>;
  if (!data) return <div>Error loading track</div>;

  const { track, daily_chart, playlists, countries, cities } = data;

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center gap-6">
        <Image
          src={track.image}
          alt={track.track}
          width={120}
          height={120}
          className="rounded-xl"
        />
        <div>
          <h1 className="text-3xl font-bold">{track.track}</h1>
          <p className="text-zinc-400">
            Released {track.release_date}
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Kpi title="Streams" value={track.streams} icon={<TrendingUp />} />
        <Kpi title="Listeners" value={track.listeners} icon={<Users />} />
        <Kpi title="Playlist adds" value={track.playlist_adds} icon={<ListMusic />} />
        <Kpi title="Saves" value={track.saves} icon={<Bookmark />} />
      </div>

      {/* DAILY CHART (placeholder) */}
      <TrackDailyChart data={daily_chart} />



      {/* PLAYLISTS */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Top playlists</h3>

        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="text-left py-2">Playlist</th>
              <th className="text-left py-2">Creator</th>
              <th className="text-right py-2">Streams</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((p: any, i: number) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="py-2">{p.playlist}</td>
                <td className="py-2 text-zinc-400">{p.creator}</td>
                <td className="py-2 text-right">
                  {p.streams.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Top Countries</h3>

        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="text-left py-2">Rank</th>
              <th className="text-left py-2">Country</th>
              <th className="text-right py-2">Streams</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c: any, i: number) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="py-2">{c.rank}</td>
                <td className="py-2 text-zinc-400">{c.country}</td>
                <td className="py-2 text-right">
                  {c.streams.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Top Cities</h3>

        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="text-left py-2">Rank</th>
              <th className="text-left py-2">City</th>
              <th className="text-left py-2">Country</th>
              <th className="text-right py-2">Streams</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c: any, i: number) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="py-2">{c.rank}</td>
                <td className="py-2 text-zinc-400">{c.city}</td>
                <td className="py-2 text-zinc-400">{c.country}</td>
                <td className="py-2 text-right">
                  {c.streams.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ title, value, icon }: any) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-zinc-400 mb-1">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <div className="text-2xl font-bold">
        {value?.toLocaleString()}
      </div>
    </div>
  );
}
