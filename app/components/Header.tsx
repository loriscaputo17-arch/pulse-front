'use client';
import { Search, User } from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import { useArtist } from '../context/ArtistContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const { artists, currentArtist, setCurrentArtist } = useArtist();

  return (
    <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-6 backdrop-blur-md bg-black/20">
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-96">
        <Search size={18} className="text-zinc-500" />
        <input
          placeholder="Cerca tracce o artisti..."
          className="bg-transparent px-3 text-xs w-full outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        {artists.length > 1 && (
          <ArtistSelector
            artists={artists}
            currentArtist={currentArtist}
            onSelect={setCurrentArtist}
          />
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">
            {currentArtist?.name ?? ''}
          </span>
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
