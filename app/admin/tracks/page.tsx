'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import UploadTracksTab from '../components/Uploadtrackstab';

export default function AdminTracksPage() {
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase.from('artists').select('id, name').order('name').then(({ data }) => setArtists(data ?? []));
  }, []);
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>Import Tracks</h1>
        <p style={{ fontSize: 13, color: '#7c7a8e', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>Upload track-level data from Spotify for Artists</p>
      </div>
      <UploadTracksTab artists={artists} />
    </>
  );
}