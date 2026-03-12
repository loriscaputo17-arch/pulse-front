'use client';

import { useEffect, useState, useMemo } from 'react';
import { useArtist } from '../../context/ArtistContext';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { TrendingUp, Users, Bookmark, ListMusic, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return <>{text}</>;
  const q = query.trim();
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: 'rgba(167,139,250,0.25)', color: '#c4b5fd', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function TracksPage() {
  const router = useRouter();
  const { currentArtist } = useArtist();
  const [tracks,  setTracks]  = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query,   setQuery]   = useState('');

  useEffect(() => {
    if (!currentArtist) return;
    setLoading(true);
    supabase
      .from('tracks')
      .select('id, title, image_url, streams, listeners, saves, playlist_adds, release_date')
      .eq('artist_id', currentArtist.id)
      .order('streams', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setTracks(data ?? []);
        setLoading(false);
      });
  }, [currentArtist]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(t => t.title?.toLowerCase().includes(q));
  }, [tracks, query]);

  if (!currentArtist) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      Select an artist to view tracks
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>Loading tracks…</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .tracks-wrap { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .track-row { transition: background 0.15s; cursor: pointer; }
        .track-row:hover { background: rgba(124,92,252,0.06) !important; }
        .track-row:hover .track-title { color: #a78bfa; }
        .search-input { width: 100%; background: transparent; border: none; outline: none; color: #f0eeff; font-size: 13px; font-family: 'DM Sans', sans-serif; }
        .search-input::placeholder { color: #7c7a8e; }
      `}</style>

      <div className="tracks-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
              Tracks
            </h1>
            <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '4px 0 0' }}>
              {query
                ? `${filtered.length} risultat${filtered.length === 1 ? 'o' : 'i'} su ${tracks.length}`
                : `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} · by stream`}
            </p>
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(13,13,22,0.7)',
            border: `1px solid ${query ? 'rgba(124,92,252,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '9px 14px',
            backdropFilter: 'blur(16px)', width: 260,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: query ? '0 0 0 3px rgba(124,92,252,0.1)' : 'none',
          }}>
            <Search size={14} color="#7c7a8e" style={{ flexShrink: 0 }} />
            <input
              className="search-input"
              placeholder="Search track…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: '#7c7a8e', flexShrink: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {tracks.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            No traces found. Import a screenshot from the Admin section.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif", background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            <Search size={22} color="#7c7a8e" />
            <span>No results for "<span style={{ color: '#a78bfa' }}>{query}</span>"</span>
          </div>
        ) : (
          <div style={{ background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { label: '#',                       align: 'left'  },
                    { label: 'Track',                 align: 'left'  },
                    { label: <TrendingUp size={14} />,  align: 'right', title: 'Streams'       },
                    { label: <Users size={14} />,       align: 'right', title: 'Listeners'     },
                    { label: <ListMusic size={14} />,   align: 'right', title: 'Playlist Adds' },
                    { label: <Bookmark size={14} />,    align: 'right', title: 'Saves'         },
                    { label: 'Release',                 align: 'right' },
                  ].map((h, i) => (
                    <th key={i} title={(h as any).title} style={{ padding: '12px 16px', textAlign: h.align as any, fontSize: 11, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    className="track-row"
                    onClick={() => router.push(`/dashboard/tracks/${t.id}`)}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#7c7a8e', fontFamily: "'Syne',sans-serif", fontWeight: 700, width: 40 }}>
                      {i + 1}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {t.image_url ? (
                          <Image src={t.image_url} alt={t.title} width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                            🎵
                          </div>
                        )}
                        <div>
                          <div className="track-title" style={{ fontSize: 13, fontWeight: 600, color: '#f0eeff', fontFamily: "'DM Sans',sans-serif", transition: 'color 0.15s', lineHeight: 1.3 }}>
                            <HighlightMatch text={t.title} query={query} />
                          </div>
                          {t.release_date && (
                            <div style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
                              {new Date(t.release_date).getFullYear()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#34d399', fontFamily: "'Syne',sans-serif" }}>
                      {fmt(t.streams)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#c4c0d8', fontFamily: "'Syne',sans-serif" }}>
                      {fmt(t.listeners)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#c4c0d8', fontFamily: "'Syne',sans-serif" }}>
                      {fmt(t.playlist_adds)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#c4c0d8', fontFamily: "'Syne',sans-serif" }}>
                      {fmt(t.saves)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
                      {t.release_date
                        ? new Date(t.release_date).toLocaleDateString('en-EN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}