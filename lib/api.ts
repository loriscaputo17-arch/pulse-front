// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getTrackStats(trackId: number) {
  const res = await fetch(`${API_BASE_URL}/tracks/${trackId}/stats`);
  if (!res.ok) throw new Error('Errore nel caricamento dati');
  return res.json();
}

export async function getTracksConfig() {
  const res = await fetch(`${API_BASE_URL}/tracks`);
  if (!res.ok) throw new Error('Errore nel caricamento tracce');
  return res.json();
}

export async function getArtistStats(user_id: string) {
  const res = await fetch(
    `${API_BASE_URL}/users/${user_id}/stats`,
    { credentials: 'include' }
  );

  if (!res.ok) throw new Error('Errore nel caricamento dati');
  return res.json();
}
