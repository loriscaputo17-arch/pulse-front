'use client';
import { Search, Bell, User } from 'lucide-react';
import ArtistSelector from './ArtistSelector';
import { useArtist } from '../context/ArtistContext';

export default function Header() {
  const { artists, currentArtist, setCurrentArtist } = useArtist();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');

        .header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background: rgba(5,5,10,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 40;
          gap: 16px;
          flex-shrink: 0;
        }

        /* Search */
        .header-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px;
          padding: 0 14px;
          height: 38px;
          width: 280px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .header-search:focus-within {
          border-color: rgba(124,92,252,0.5);
          box-shadow: 0 0 0 3px rgba(124,92,252,0.1);
        }
        .header-search input {
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #f0eeff;
          width: 100%;
        }
        .header-search input::placeholder { color: #7c7a8e; }

        /* Right side */
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Icon button */
        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #7c7a8e;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          position: relative;
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #f0eeff;
          border-color: rgba(255,255,255,0.12);
        }

        /* Notification dot */
        .notif-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #7c5cfc;
          border: 1.5px solid #05050a;
        }

        /* Divider */
        .header-divider {
          width: 1px; height: 24px;
          background: rgba(255,255,255,0.07);
          margin: 0 4px;
        }

        /* Avatar */
        .header-avatar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 10px 4px 4px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .header-avatar:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
        }
        .avatar-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #7c5cfc, #c084fc);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .avatar-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #c4c0d8;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <header className="header">
        {/* Search */}
        <div className="header-search">
          <Search size={14} color="#7c7a8e" strokeWidth={2} />
          <input placeholder="Cerca tracce o artisti…" />
        </div>

        {/* Right */}
        <div className="header-right">

          {/* Artist selector */}
          {artists.length > 1 && (
            <ArtistSelector
              artists={artists}
              currentArtist={currentArtist}
              onSelect={setCurrentArtist}
            />
          )}

          {/* Notifications */}
          <button className="icon-btn">
            <Bell size={15} strokeWidth={2} />
            <span className="notif-dot" />
          </button>

          <div className="header-divider" />

          {/* Avatar */}
          <div className="header-avatar">
            <div className="avatar-icon">
              <User size={13} color="white" strokeWidth={2} />
            </div>
            <span className="avatar-name">
              {currentArtist?.name ?? 'Account'}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}