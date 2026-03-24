'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ShieldCheck, Music2, Plus, Trash2, RefreshCw, UserPlus, X, Check } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface Profile {
  id:    string;
  email: string;
  role:  string;
}
interface Artist {
  id:   string;
  name: string;
  slug: string;
}
interface UserArtist {
  user_id:   string;
  artist_id: string;
  role:      string;
}

/* ─── Small shared pieces ────────────────────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 100, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      fontFamily: "'Syne',sans-serif",
      background: isAdmin ? 'rgba(124,92,252,0.12)' : 'rgba(52,211,153,0.08)',
      border: `1px solid ${isAdmin ? 'rgba(124,92,252,0.28)' : 'rgba(52,211,153,0.22)'}`,
      color: isAdmin ? '#a78bfa' : '#34d399',
    }}>
      {isAdmin ? <ShieldCheck size={9} /> : <Music2 size={9} />}
      {role}
    </span>
  );
}

function Msg({ data }: { data: { ok: boolean; text: string } | null }) {
  if (!data) return null;
  return (
    <div style={{
      fontSize: 12, padding: '8px 12px', borderRadius: 8, marginTop: 8,
      background: data.ok ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
      border: `1px solid ${data.ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
      color: data.ok ? '#34d399' : '#f87171',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {data.ok ? '✓ ' : '⚠ '}{data.text}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#f0eeff', fontSize: 13, fontFamily: "'DM Sans',sans-serif",
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', ...(props.style ?? {}) }}
      onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#7c7a8e', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, disabled, onClick, style }: {
  children: React.ReactNode; disabled?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: '10px 20px', borderRadius: 10, border: 'none',
        background: '#7c5cfc', color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
        opacity: disabled ? 0.45 : 1,
        boxShadow: '0 0 16px rgba(124,92,252,0.28)',
        transition: 'background 0.15s',
        display: 'flex', alignItems: 'center', gap: 7,
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#9370ff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c5cfc'; }}
    >
      {children}
    </button>
  );
}

/* ─── Assign Modal ───────────────────────────────────────────────────────────── */

function AssignModal({
  user, artists, userArtists, onClose, onDone,
}: {
  user:       Profile;
  artists:    Artist[];
  userArtists: UserArtist[];
  onClose:    () => void;
  onDone:     () => void;
}) {
  const [artistId, setArtistId] = useState('');
  const [role,     setRole]     = useState('viewer');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  const available = artists.filter(
    a => !userArtists.find(ua => ua.artist_id === a.id && ua.user_id === user.id)
  );

  const handleSave = async () => {
    if (!artistId) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from('user_artists').upsert(
      { user_id: user.id, artist_id: artistId, role },
      { onConflict: 'user_id,artist_id' }
    );
    setSaving(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Artist assigned.' });
    setTimeout(() => { onDone(); onClose(); }, 800);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d0d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#7c7a8e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} />
        </button>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: '#f0eeff' }}>Assign artist</div>
          <div style={{ fontSize: 12, color: '#7c7a8e', marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{user.email}</div>
        </div>
        <Field label="Artist">
          <Select value={artistId} onChange={e => setArtistId(e.target.value)}>
            <option value="">— select artist —</option>
            {available.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Role">
          <Select value={role} onChange={e => setRole(e.target.value)}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="owner">owner</option>
          </Select>
        </Field>
        <Msg data={msg} />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <PrimaryBtn onClick={handleSave} disabled={!artistId || saving}>
            {saving ? 'Saving…' : <><Check size={13} /> Assign</>}
          </PrimaryBtn>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#7c7a8e', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── UserRow ────────────────────────────────────────────────────────────────── */

function UserRow({
  user, artists, userArtists,
  onAssign, onUnassign, onRoleChange,
}: {
  user:         Profile;
  artists:      Artist[];
  userArtists:  UserArtist[];
  onAssign:     (u: Profile) => void;
  onUnassign:   (userId: string, artistId: string) => void;
  onRoleChange: (userId: string, role: string) => void;
}) {
  const assigned = userArtists
    .filter(ua => ua.user_id === user.id)
    .map(ua => ({ ...artists.find(a => a.id === ua.artist_id)!, assignedRole: ua.role }))
    .filter(a => a.id);

  const initials = (user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Avatar + email */}
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: user.role === 'admin'
              ? 'linear-gradient(135deg,rgba(124,92,252,0.35),rgba(192,132,252,0.35))'
              : 'linear-gradient(135deg,rgba(52,211,153,0.22),rgba(56,189,248,0.22))',
            border: `1px solid ${user.role === 'admin' ? 'rgba(124,92,252,0.3)' : 'rgba(52,211,153,0.22)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 800,
            color: user.role === 'admin' ? '#c4b5fd' : '#6ee7b7',
          }}>{initials}</div>
          <span style={{ fontSize: 13, color: '#f0eeff', fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>
            {user.email ?? '—'}
          </span>
        </div>
      </td>

      {/* Role selector */}
      <td style={{ padding: '12px 14px' }}>
        <select
          value={user.role}
          onChange={e => onRoleChange(user.id, e.target.value)}
          style={{
            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Syne',sans-serif",
            border: `1px solid ${user.role === 'admin' ? 'rgba(124,92,252,0.3)' : 'rgba(52,211,153,0.22)'}`,
            background: user.role === 'admin' ? 'rgba(124,92,252,0.1)' : 'rgba(52,211,153,0.07)',
            color: user.role === 'admin' ? '#a78bfa' : '#34d399',
            outline: 'none', appearance: 'none',
          }}
        >
          <option value="artist">artist</option>
          <option value="admin">admin</option>
        </select>
      </td>

      {/* Artists chips */}
      <td style={{ padding: '12px 14px' }}>
        {assigned.length === 0 ? (
          <span style={{ fontSize: 12, color: 'rgba(124,122,142,0.4)', fontStyle: 'italic' }}>—</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {assigned.map(a => (
              <span key={a.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px 3px 10px', borderRadius: 100,
                background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
                fontSize: 11, color: '#34d399', fontFamily: "'DM Sans',sans-serif",
              }}>
                {a.name}
                <span style={{ fontSize: 9, color: 'rgba(52,211,153,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {a.assignedRole}
                </span>
                <button
                  onClick={() => onUnassign(user.id, a.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(52,211,153,0.4)', fontSize: 13, padding: 0, lineHeight: 1, display: 'flex', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(52,211,153,0.4)')}
                >✕</button>
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Actions */}
      <td style={{ padding: '12px 14px' }}>
        <button
          onClick={() => onAssign(user)}
          style={{
            padding: '5px 12px', borderRadius: 7,
            border: '1px solid rgba(124,92,252,0.28)',
            background: 'rgba(124,92,252,0.08)', color: '#a78bfa',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Syne',sans-serif", whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,92,252,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,92,252,0.08)')}
        >
          <Plus size={11} /> Artist
        </button>
      </td>
    </tr>
  );
}

/* ─── UsersTab ───────────────────────────────────────────────────────────────── */

export default function UsersTab() {
  const [users,       setUsers]       = useState<Profile[]>([]);
  const [artists,     setArtists]     = useState<Artist[]>([]);
  const [userArtists, setUserArtists] = useState<UserArtist[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [assignUser,  setAssignUser]  = useState<Profile | null>(null);
  const [filter,      setFilter]      = useState<'all' | 'admin' | 'artist'>('all');

  /* Create user */
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole,     setNewRole]     = useState('artist');
  const [creating,    setCreating]    = useState(false);
  const [createMsg,   setCreateMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  /* Create artist */
  const [newArtistName,  setNewArtistName]  = useState('');
  const [newArtistSlug,  setNewArtistSlug]  = useState('');
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [artistMsg,      setArtistMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setRefreshing(true);
    const [{ data: profilesData }, { data: artistsData }, { data: uaData }] = await Promise.all([
      supabase.from('profiles').select('id, email, role'),
      supabase.from('artists').select('id, name, slug').order('name'),
      supabase.from('user_artists').select('user_id, artist_id, role'),
    ]);
    setUsers(profilesData ?? []);
    setArtists(artistsData ?? []);
    setUserArtists(uaData ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  async function handleRoleChange(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }

  async function handleUnassign(userId: string, artistId: string) {
    await supabase.from('user_artists').delete().eq('user_id', userId).eq('artist_id', artistId);
    setUserArtists(prev => prev.filter(ua => !(ua.user_id === userId && ua.artist_id === artistId)));
  }

  async function handleCreateUser() {
    setCreating(true); setCreateMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      }
    );
    const json = await res.json();
    if (res.ok) {
      setCreateMsg({ ok: true, text: 'User created successfully.' });
      setNewEmail(''); setNewPassword(''); setNewRole('artist');
      load();
    } else {
      setCreateMsg({ ok: false, text: json.error ?? 'Error creating user.' });
    }
    setCreating(false);
  }

  async function handleCreateArtist() {
    setCreatingArtist(true); setArtistMsg(null);
    const slug = newArtistSlug || newArtistName.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase.from('artists').insert({ name: newArtistName, slug });
    if (error) setArtistMsg({ ok: false, text: error.message });
    else {
      setArtistMsg({ ok: true, text: 'Artist created.' });
      setNewArtistName(''); setNewArtistSlug('');
      load();
    }
    setCreatingArtist(false);
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const counts   = { all: users.length, admin: users.filter(u => u.role === 'admin').length, artist: users.filter(u => u.role === 'artist').length };

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#7c7a8e', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: "'DM Sans',sans-serif" }}>
      {children}
    </th>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .ut-card {
          background: rgba(13,13,22,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 24px; backdrop-filter: blur(16px);
          position: relative; overflow: hidden;
        }
        .ut-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent);
        }
        .ut-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .ut-bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
        @media(max-width:860px) { .ut-bottom-grid { grid-template-columns:1fr; } }
        .ut-table-row:hover td { background: rgba(124,92,252,0.03); }
      `}</style>

      {/* Assign modal */}
      {assignUser && (
        <AssignModal
          user={assignUser}
          artists={artists}
          userArtists={userArtists}
          onClose={() => setAssignUser(null)}
          onDone={load}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1)' }}>

        {/* ── Users table ── */}
        <div className="ut-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <p className="ut-card-title" style={{ margin: 0 }}>Registered users</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 3 }}>
                {(['all', 'admin', 'artist'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
                    background: filter === f ? '#7c5cfc' : 'transparent',
                    color: filter === f ? '#fff' : '#7c7a8e',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {f === 'admin' && <ShieldCheck size={10} />}
                    {f === 'artist' && <Music2 size={10} />}
                    {f === 'all' ? 'All' : f}
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: filter === f ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)', color: filter === f ? '#fff' : '#7c7a8e' }}>
                      {counts[f]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={load} disabled={refreshing}
                style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', color: '#7c7a8e', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c4c0d8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7c7a8e')}
              >
                <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7c7a8e', padding: '16px 0', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <TH>User</TH>
                    <TH>Role</TH>
                    <TH>Linked artists</TH>
                    <TH>Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      artists={artists}
                      userArtists={userArtists}
                      onAssign={setAssignUser}
                      onUnassign={handleUnassign}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bottom grid: Create user + Create artist ── */}
        <div className="ut-bottom-grid">

          {/* Create user */}
          <div className="ut-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <UserPlus size={14} />
              </div>
              <p className="ut-card-title" style={{ margin: 0 }}>Create user</p>
            </div>
            <Field label="Email">
              <Input type="email" placeholder="user@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Field>
            <Field label="Role">
              <Select value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="artist">artist</option>
                <option value="admin">admin</option>
              </Select>
            </Field>
            <Msg data={createMsg} />
            <PrimaryBtn
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              onClick={handleCreateUser}
              disabled={!newEmail || !newPassword || creating}
            >
              {creating ? 'Creating…' : <><UserPlus size={13} /> Create user</>}
            </PrimaryBtn>
          </div>

          {/* Create artist */}
          <div className="ut-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Music2 size={14} />
              </div>
              <p className="ut-card-title" style={{ margin: 0 }}>Create artist</p>
            </div>
            <Field label="Name">
              <Input
                placeholder="Artist Name"
                value={newArtistName}
                onChange={e => {
                  setNewArtistName(e.target.value);
                  setNewArtistSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
              />
            </Field>
            <Field label="Slug">
              <Input
                placeholder="artist-name"
                value={newArtistSlug}
                onChange={e => setNewArtistSlug(e.target.value)}
              />
            </Field>
            <Msg data={artistMsg} />
            <PrimaryBtn
              style={{ marginTop: 16, width: '100%', justifyContent: 'center', background: '#059669', boxShadow: '0 0 16px rgba(5,150,105,0.25)' }}
              onClick={handleCreateArtist}
              disabled={!newArtistName || creatingArtist}
            >
              {creatingArtist ? 'Creating…' : <><Plus size={13} /> Create artist</>}
            </PrimaryBtn>
          </div>

        </div>
      </div>
    </>
  );
}