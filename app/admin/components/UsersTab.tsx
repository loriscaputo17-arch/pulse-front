'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Profile    { id: string; email: string; role: string; }
interface Artist     { id: string; name: string; slug: string; }
interface UserArtist { user_id: string; artist_id: string; role: string; }

export default function UsersTab() {
  const [users,       setUsers]       = useState<Profile[]>([]);
  const [artists,     setArtists]     = useState<Artist[]>([]);
  const [userArtists, setUserArtists] = useState<UserArtist[]>([]);
  const [loading,     setLoading]     = useState(true);

  /* New user form */
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole,     setNewRole]     = useState('user');
  const [creating,    setCreating]    = useState(false);
  const [createMsg,   setCreateMsg]   = useState<{ok:boolean;text:string}|null>(null);

  /* Assign modal */
  const [assignUser,     setAssignUser]     = useState<Profile | null>(null);
  const [assignArtistId, setAssignArtistId] = useState('');
  const [assignRole,     setAssignRole]     = useState('viewer');
  const [assigning,      setAssigning]      = useState(false);

  /* New artist form */
  const [newArtistName,  setNewArtistName]  = useState('');
  const [newArtistSlug,  setNewArtistSlug]  = useState('');
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [artistMsg,      setArtistMsg]      = useState<{ok:boolean;text:string}|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: profilesData }, { data: artistsData }, { data: uaData }] = await Promise.all([
      supabase.from('profiles').select('id, email, role'),
      supabase.from('artists').select('id, name, slug').order('name'),
      supabase.from('user_artists').select('user_id, artist_id, role'),
    ]);
    setUsers(profilesData ?? []);
    setArtists(artistsData ?? []);
    setUserArtists(uaData ?? []);
    setLoading(false);
  }

  function getArtistsForUser(userId: string) {
    return userArtists
      .filter(ua => ua.user_id === userId)
      .map(ua => ({ ...artists.find(a => a.id === ua.artist_id)!, assignedRole: ua.role }))
      .filter(Boolean);
  }

  /* ── create user via edge function ── */
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
      setNewEmail(''); setNewPassword(''); setNewRole('user');
      load();
    } else {
      setCreateMsg({ ok: false, text: json.error ?? 'Error creating user.' });
    }
    setCreating(false);
  }

  /* ── assign artist via user_artists ── */
  async function handleAssign() {
    if (!assignUser || !assignArtistId) return;
    setAssigning(true);
    await supabase.from('user_artists').upsert(
      { user_id: assignUser.id, artist_id: assignArtistId, role: assignRole },
      { onConflict: 'user_id,artist_id' }
    );
    setAssigning(false);
    setAssignUser(null);
    setAssignArtistId('');
    load();
  }

  /* ── remove assignment ── */
  async function handleUnassign(userId: string, artistId: string) {
    await supabase.from('user_artists').delete().eq('user_id', userId).eq('artist_id', artistId);
    load();
  }

  /* ── create artist ── */
  async function handleCreateArtist() {
    setCreatingArtist(true); setArtistMsg(null);
    const { error } = await supabase.from('artists').insert({
      name: newArtistName,
      slug: newArtistSlug || newArtistName.toLowerCase().replace(/\s+/g, '-'),
    });
    if (error) setArtistMsg({ ok: false, text: error.message });
    else {
      setArtistMsg({ ok: true, text: 'Artist created.' });
      setNewArtistName(''); setNewArtistSlug('');
      load();
    }
    setCreatingArtist(false);
  }

  return (
    <>
      <style>{`
        .ut-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .ut-grid { grid-template-columns: 1fr; } }
        .ut-card {
          background: rgba(13,13,22,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 24px; backdrop-filter: blur(16px);
          position: relative; overflow: hidden;
        }
        .ut-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5) 40%, rgba(167,139,250,0.5) 60%, transparent);
        }
        .ut-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .ut-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
        .ut-label { font-size:11px; font-weight:600; color:#7c7a8e; letter-spacing:0.07em; text-transform:uppercase; }
        .ut-input {
          width:100%; padding:10px 14px; border-radius:10px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          color:#f0eeff; font-size:13px; font-family:'DM Sans',sans-serif; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .ut-input:focus { border-color:rgba(124,92,252,0.6); box-shadow:0 0 0 3px rgba(124,92,252,0.1); }
        .ut-select { appearance:none; cursor:pointer; }
        .ut-msg { font-size:12px; padding:8px 12px; border-radius:8px; margin-top:8px; }
        .ut-msg.ok  { background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25); color:#34d399; }
        .ut-msg.err { background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25); color:#f87171; }
        .ut-table { width:100%; border-collapse:collapse; }
        .ut-table th { font-size:10px; font-weight:700; color:#7c7a8e; letter-spacing:0.08em; text-transform:uppercase; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.06); text-align:left; }
        .ut-table td { padding:12px; font-size:13px; color:#c4c0d8; border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; vertical-align:middle; }
        .ut-table tr:last-child td { border-bottom:none; }
        .ut-table tr:hover td { background:rgba(124,92,252,0.04); }
        .role-badge { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; }
        .role-admin { background:rgba(124,92,252,0.15); color:#a78bfa; border:1px solid rgba(124,92,252,0.25); }
        .role-user  { background:rgba(255,255,255,0.06); color:#7c7a8e; border:1px solid rgba(255,255,255,0.1); }
        .chips-wrap { display:flex; flex-wrap:wrap; gap:6px; }
        .artist-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 8px 3px 10px; border-radius:20px; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2); font-size:12px; color:#34d399; }
        .chip-role { font-size:10px; color:rgba(52,211,153,0.6); }
        .chip-remove { background:none; border:none; cursor:pointer; color:rgba(52,211,153,0.4); font-size:13px; padding:0; line-height:1; transition:color 0.15s; }
        .chip-remove:hover { color:#f87171; }
        .no-artist { font-size:12px; color:rgba(124,122,142,0.4); font-style:italic; }
        .assign-btn { padding:5px 12px; border-radius:7px; border:1px solid rgba(124,92,252,0.3); background:rgba(124,92,252,0.1); color:#a78bfa; font-size:11px; font-weight:700; cursor:pointer; transition:background 0.15s; font-family:'Syne',sans-serif; white-space:nowrap; }
        .assign-btn:hover { background:rgba(124,92,252,0.2); }
        .modal-overlay { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:24px; }
        .modal-box { background:#0d0d16; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:28px; width:100%; max-width:420px; box-shadow:0 24px 60px rgba(0,0,0,0.6); }
        .modal-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#f0eeff; margin-bottom:20px; }
        .btn-primary { padding:10px 20px; border-radius:10px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; transition:background 0.15s; box-shadow:0 0 16px rgba(124,92,252,0.3); }
        .btn-primary:hover { background:#9370ff; }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-ghost { padding:10px 20px; border-radius:10px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#7c7a8e; cursor:pointer; font-family:'Syne',sans-serif; font-size:13px; font-weight:600; transition:all 0.15s; }
        .btn-ghost:hover { color:#f0eeff; border-color:rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Assign modal ── */}
      {assignUser && (
        <div className="modal-overlay" onClick={() => setAssignUser(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Assign artist to {assignUser.email}</p>
            <div className="ut-field">
              <label className="ut-label">Artist</label>
              <select className="ut-input ut-select" value={assignArtistId} onChange={e => setAssignArtistId(e.target.value)}>
                <option value="">— select —</option>
                {artists
                  .filter(a => !userArtists.find(ua => ua.artist_id === a.id && ua.user_id === assignUser.id))
                  .map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                }
              </select>
            </div>
            <div className="ut-field">
              <label className="ut-label">Role</label>
              <select className="ut-input ut-select" value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                <option value="viewer">viewer</option>
                <option value="editor">editor</option>
                <option value="owner">owner</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn-primary" onClick={handleAssign} disabled={!assignArtistId || assigning}>
                {assigning ? 'Saving…' : 'Assign'}
              </button>
              <button className="btn-ghost" onClick={() => setAssignUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="ut-grid">

        {/* ── Users table ── */}
        <div style={{ gridColumn:'1 / -1' }}>
          <div className="ut-card">
            <p className="ut-card-title">Registered users</p>
            {loading ? (
              <p style={{ fontSize:13, color:'#7c7a8e' }}>Loading…</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="ut-table">
                  <thead>
                    <tr><th>Email</th><th>Role</th><th>Artists</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const assigned = getArtistsForUser(u.id);
                      return (
                        <tr key={u.id}>
                          <td style={{ color:'#f0eeff', fontWeight:500 }}>{u.email ?? '—'}</td>
                          <td><span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>{u.role}</span></td>
                          <td>
                            {assigned.length > 0 ? (
                              <div className="chips-wrap">
                                {assigned.map(a => (
                                  <span key={a.id} className="artist-chip">
                                    {a.name}
                                    <span className="chip-role">{a.assignedRole}</span>
                                    <button className="chip-remove" onClick={() => handleUnassign(u.id, a.id)}>✕</button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-artist">—</span>
                            )}
                          </td>
                          <td>
                            <button className="assign-btn" onClick={() => { setAssignUser(u); setAssignArtistId(''); setAssignRole('viewer'); }}>
                              + Artist
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Create user ── */}
        <div className="ut-card">
          <p className="ut-card-title">Create new user</p>
          <div className="ut-field">
            <label className="ut-label">Email</label>
            <input className="ut-input" type="email" placeholder="user@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          </div>
          <div className="ut-field">
            <label className="ut-label">Password</label>
            <input className="ut-input" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="ut-field">
            <label className="ut-label">Role</label>
            <select className="ut-input ut-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          {createMsg && <div className={`ut-msg ${createMsg.ok ? 'ok' : 'err'}`}>{createMsg.text}</div>}
          <button className="btn-primary" style={{ marginTop:16, width:'100%' }}
            onClick={handleCreateUser} disabled={!newEmail || !newPassword || creating}>
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </div>

        {/* ── Create artist ── */}
        <div className="ut-card">
          <p className="ut-card-title">Create new artist</p>
          <div className="ut-field">
            <label className="ut-label">Name</label>
            <input className="ut-input" placeholder="Artist Name" value={newArtistName} onChange={e => setNewArtistName(e.target.value)} />
          </div>
          <div className="ut-field">
            <label className="ut-label">Slug (optional)</label>
            <input className="ut-input" placeholder="artist-name" value={newArtistSlug} onChange={e => setNewArtistSlug(e.target.value)} />
          </div>
          {artistMsg && <div className={`ut-msg ${artistMsg.ok ? 'ok' : 'err'}`}>{artistMsg.text}</div>}
          <button className="btn-primary" style={{ marginTop:16, width:'100%' }}
            onClick={handleCreateArtist} disabled={!newArtistName || creatingArtist}>
            {creatingArtist ? 'Creating…' : 'Create artist'}
          </button>
        </div>

      </div>
    </>
  );
}