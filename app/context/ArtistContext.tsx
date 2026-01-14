'use client';
import { createContext, useContext } from 'react';
import { Artist } from '../types/artist';

type ArtistContextType = {
  artists: Artist[];
  currentArtist: Artist | null;
  setCurrentArtist: (artist: Artist | null) => void;
};

export const ArtistContext = createContext<ArtistContextType | null>(null);

export function useArtist() {
  const ctx = useContext(ArtistContext);
  if (!ctx) {
    throw new Error('useArtist must be used inside ArtistProvider');
  }
  return ctx;
}
