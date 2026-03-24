'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminSidebar from '../components/AdminSidebar';
import ArtistSidebar from '../components/ArtistSidebar';
import Header from '../components/Header';
import { Artist } from '../types/artist';
import { ArtistContext } from '../context/ArtistContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'artist' | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = profile?.role as 'admin' | 'artist' | null;
      if (!userRole || (userRole !== 'admin' && userRole !== 'artist')) {
        router.push('/login');
        return;
      }
      setRole(userRole);

      if (userRole === 'admin') {
        // Admin sees all artists
        const { data } = await supabase.from('artists').select('*').order('name');
        setArtists(data ?? []);
        if (data?.length === 1) setCurrentArtist(data[0]);
      } else {
        // Artist sees only their linked artists
        const { data } = await supabase
          .from('user_artists')
          .select('artists(*)')
          .eq('user_id', user.id);
        const linked = (data ?? []).map((r: any) => r.artists).filter(Boolean);
        setArtists(linked);
        if (linked.length >= 1) setCurrentArtist(linked[0]);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#05050a', flexDirection: 'column', gap: 16,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 34, height: 34, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <ArtistContext.Provider value={{ artists, currentArtist, setCurrentArtist }}>
      <div style={{ display: 'flex', height: '100vh', background: '#05050a', color: '#f0eeff' }}>
        {role === 'admin' ? <AdminSidebar /> : <ArtistSidebar />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#05050a' }}>
          <Header />
          <section style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            {children}
          </section>
        </main>
      </div>
    </ArtistContext.Provider>
  );
}