'use client';
import { Artist } from '../types/artist';

type Props = {
  artists: Artist[];
  currentArtist: Artist | null;
  onSelect: (artist: Artist | null) => void;
};

export default function ArtistSelector({
  artists,
  currentArtist,
  onSelect,
}: Props) {
  return (
    <select
      value={currentArtist?.id ?? ''}
      onChange={(e) => {
        const selected =
          artists.find((a) => a.id === e.target.value) ?? null;

        onSelect(selected);
      }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm"
    >
      <option value="">Select an artist</option>
      {artists.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
