'use client';
import UploadTab from '../components/UploadTab';

export default function AdminUploadPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>Upload Screenshots</h1>
        <p style={{ fontSize: 13, color: '#7c7a8e', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>AI-powered bulk import from Spotify for Artists</p>
      </div>
      <UploadTab />
    </>
  );
}