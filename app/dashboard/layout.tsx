'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Artist } from '../types/artist';
import { ArtistContext } from '../context/ArtistContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase.from('artists').select('*');
      setArtists(data || []);
      if (data?.length === 1) setCurrentArtist(data[0]);
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <ArtistContext.Provider value={{ artists, currentArtist, setCurrentArtist }}>
      <div className="flex h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
          <Header />
          <section className="flex-1 overflow-y-auto p-6">
            {children}
          </section>
        </main>
      </div>
    </ArtistContext.Provider>
  );
}
