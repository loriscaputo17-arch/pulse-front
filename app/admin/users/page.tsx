'use client';
import UsersTab from '../components/UsersTab';

export default function AdminUsersPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>Users & Artists</h1>
        <p style={{ fontSize: 13, color: '#7c7a8e', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>Manage accounts, roles and artist assignments</p>
      </div>
      <UsersTab />
    </>
  );
}