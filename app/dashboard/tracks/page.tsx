'use client';

import { useEffect, useState } from 'react';
import { useArtist } from '../../context/ArtistContext';

import Image from 'next/image';
import { TrendingUp, Users, Bookmark, ListMusic } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TracksPage({ artistId }: { artistId: string }) {
    const router = useRouter();
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentArtist } = useArtist();

  useEffect(() => {
    if (!currentArtist) return;
    
    fetch(`${API_BASE_URL}/artists/${currentArtist.id}/tracks`)
      .then(res => res.json())
      .then(data => {
        setTracks(data.tracks || []);
        setLoading(false);
      });
  }, [artistId]);

  if (loading) {
    return <div className="text-zinc-400">Loading tracks…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tracks</h1>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">Track</th>
              <th className="p-4 text-right"><TrendingUp size={16} /></th>
              <th className="p-4 text-right"><Users size={16} /></th>
              <th className="p-4 text-right"><ListMusic size={16} /></th>
              <th className="p-4 text-right"><Bookmark size={16} /></th>
              <th className="p-4 text-right">Release</th>
            </tr>
          </thead>
          <tbody>
  {tracks.map((t, i) => (
    <tr
      key={t.song_id}
      onClick={() => router.push(`/dashboard/tracks/${t.song_id}`)}
      className="border-t border-zinc-800 hover:bg-zinc-800/40 cursor-pointer transition"
    >
      <td className="p-4 text-zinc-400">{i + 1}</td>

      <td className="p-4 flex items-center gap-3">
        <Image
          src={t.image}
          alt={t.track}
          width={44}
          height={44}
          className="rounded-md"
        />
        <div>
          <div className="font-medium">{t.track}</div>
          <div className="text-xs text-zinc-400">ID {t.song_id}</div>
        </div>
      </td>

      <td className="p-4 text-right">{t.streams?.toLocaleString()}</td>
      <td className="p-4 text-right">{t.listeners?.toLocaleString()}</td>
      <td className="p-4 text-right">{t.playlist_adds?.toLocaleString()}</td>
      <td className="p-4 text-right">{t.saves?.toLocaleString()}</td>
      <td className="p-4 text-right text-zinc-400">{t.release_date}</td>
    </tr>
  ))}
</tbody>


        </table>
      </div>
    </div>
  );
}
