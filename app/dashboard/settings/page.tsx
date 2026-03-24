'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Lock, Music2, Palette, Check, Eye, EyeOff, ChevronRight } from 'lucide-react';

type Section = 'profile' | 'password' | 'artists' | 'preferences';

interface Artist { id: string; name: string; role: string; }

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 12,
      background: ok ? 'rgba(16,24,20,0.97)' : 'rgba(24,10,10,0.97)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontFamily: "'DM Sans',sans-serif", fontSize: 13,
      color: ok ? '#34d399' : '#f87171',
      animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <span style={{ fontSize: 16 }}>{ok ? '✓' : '⚠'}</span>
      {msg}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: '#7c7a8e',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        fontFamily: "'DM Sans',sans-serif",
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#f0eeff', fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

function SaveBtn({ loading, label = 'Save changes' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: '#7c5cfc', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
        opacity: loading ? 0.6 : 1, transition: 'background 0.15s, opacity 0.15s',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 0 16px rgba(124,92,252,0.3)',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#9370ff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c5cfc'; }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid #fff', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {label}
    </button>
  );
}

function ProfileSection({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
      setName(data.user?.user_metadata?.full_name ?? '');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    setLoading(false);
    if (error) toast(error.message, false);
    else toast('Profile updated');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Display name">
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
        />
      </Field>
      <Field label="Email">
        <input
          style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
          value={email}
          readOnly
        />
        <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>
          Email can't be changed from here.
        </span>
      </Field>
      <div><SaveBtn loading={loading} /></div>
    </form>
  );
}

function PasswordSection({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast('Passwords do not match', false); return; }
    if (next.length < 8)  { toast('Password must be at least 8 characters', false); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (error) toast(error.message, false);
    else { toast('Password updated'); setCurrent(''); setNext(''); setConfirm(''); }
  };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: '#7c7a8e', display: 'flex',
    }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Current password">
        <div style={{ position: 'relative' }}>
          <input
            style={inputStyle} type={showCur ? 'text' : 'password'}
            value={current} onChange={e => setCurrent(e.target.value)}
            placeholder="••••••••"
            onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
          />
          <EyeBtn show={showCur} toggle={() => setShowCur(v => !v)} />
        </div>
      </Field>
      <Field label="New password">
        <div style={{ position: 'relative' }}>
          <input
            style={inputStyle} type={showNext ? 'text' : 'password'}
            value={next} onChange={e => setNext(e.target.value)}
            placeholder="Min. 8 characters"
            onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
          />
          <EyeBtn show={showNext} toggle={() => setShowNext(v => !v)} />
        </div>
        {next.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            {[4, 8, 12].map(n => (
              <div key={n} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: next.length >= n
                  ? next.length < 8 ? '#f59e0b' : '#34d399'
                  : 'rgba(255,255,255,0.08)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        )}
      </Field>
      <Field label="Confirm new password">
        <input
          style={{
            ...inputStyle,
            borderColor: confirm && confirm !== next ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.09)',
          }}
          type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          onFocus={e => { e.target.style.borderColor = 'rgba(124,92,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,252,0.1)'; }}
          onBlur={e  => {
            e.target.style.borderColor = confirm && confirm !== next ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.09)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {confirm && confirm !== next && (
          <span style={{ fontSize: 11, color: '#f87171', fontFamily: "'DM Sans',sans-serif" }}>
            Passwords do not match
          </span>
        )}
      </Field>
      <div><SaveBtn loading={loading} label="Update password" /></div>
    </form>
  );
}

function ArtistsSection() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_artists')
        .select('artist_id, role, artists(id, name)')
        .eq('user_id', user.id);
      setArtists((data ?? []).map((r: any) => ({
        id:   r.artists.id,
        name: r.artists.name,
        role: r.role,
      })));
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 16, height: 16, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading…
    </div>
  );

  if (!artists.length) return (
    <div style={{
      textAlign: 'center', padding: '32px 16px',
      color: '#7c7a8e', fontSize: 13, fontFamily: "'DM Sans',sans-serif",
      background: 'rgba(255,255,255,0.02)', borderRadius: 12,
      border: '1px dashed rgba(255,255,255,0.07)',
    }}>
      No artists linked to your account.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {artists.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'rgba(124,92,252,0.12)',
            border: '1px solid rgba(124,92,252,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
          }}>🎤</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eeff', fontFamily: "'DM Sans',sans-serif" }}>
              {a.name}
            </div>
            <div style={{ fontSize: 11, color: '#7c7a8e', marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
              Role: {a.role}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', fontFamily: "'Syne',sans-serif",
            padding: '3px 10px', borderRadius: 100,
            background: a.role === 'admin' ? 'rgba(124,92,252,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${a.role === 'admin' ? 'rgba(124,92,252,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: a.role === 'admin' ? '#a78bfa' : '#7c7a8e',
          }}>
            {a.role}
          </span>
        </div>
      ))}
      <p style={{ fontSize: 12, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
        To add or remove artists, contact an admin.
      </p>
    </div>
  );
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
];

const THEMES = [
  { key: 'dark',   label: 'Dark',   emoji: '🌙' },
];

function PreferencesSection({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [lang,  setLang]  = useState(() => localStorage?.getItem('pref_lang')  ?? 'en');
  const [theme, setTheme] = useState(() => localStorage?.getItem('pref_theme') ?? 'dark');

  const save = () => {
    localStorage.setItem('pref_lang',  lang);
    localStorage.setItem('pref_theme', theme);
    toast('Preferences saved');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Language">
        <div style={{ display: 'flex', gap: 10 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              type="button"
              style={{
                padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${lang === l.code ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: lang === l.code ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                color: lang === l.code ? '#a78bfa' : '#7c7a8e',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {lang === l.code && <Check size={13} />}
              {l.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Theme">
        <div style={{ display: 'flex', gap: 10 }}>
          {THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              type="button"
              style={{
                padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${theme === t.key ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: theme === t.key ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                color: theme === t.key ? '#a78bfa' : '#7c7a8e',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{t.emoji}</span>
              {theme === t.key && <Check size={13} />}
              {t.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>
          Full light theme coming soon.
        </span>
      </Field>

      <div>
        <button
          onClick={save}
          type="button"
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: '#7c5cfc', color: '#fff', cursor: 'pointer',
            fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
            boxShadow: '0 0 16px rgba(124,92,252,0.3)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#9370ff')}
          onMouseLeave={e => (e.currentTarget.style.background = '#7c5cfc')}
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}

const NAV: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'profile',     label: 'Profile',      icon: <User size={15} />,    description: 'Name and email' },
  { id: 'password',    label: 'Password',     icon: <Lock size={15} />,    description: 'Change password' },
  { id: 'artists',     label: 'Artists',      icon: <Music2 size={15} />,  description: 'Linked artists' },
  { id: 'preferences', label: 'Preferences',  icon: <Palette size={15} />, description: 'Language & theme' },
];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const activeNav = NAV.find(n => n.id === section)!;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .settings-section-content { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .nav-item { transition: background 0.15s, border-color 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
            Settings
          </h1>
          <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '4px 0 0' }}>
            Manage your account and preferences
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Sidebar nav */}
          <div style={{
            background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(16px)',
            position: 'sticky', top: 24,
          }}>
            {NAV.map((n, i) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  className="nav-item"
                  onClick={() => setSection(n.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(124,92,252,0.1)' : 'transparent',
                    borderLeft: `2.5px solid ${active ? '#7c5cfc' : 'transparent'}`,
                    borderBottom: i < NAV.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ color: active ? '#a78bfa' : '#7c7a8e', flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#f0eeff' : '#c4c0d8', fontFamily: "'DM Sans',sans-serif" }}>
                      {n.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#7c7a8e', marginTop: 1, fontFamily: "'DM Sans',sans-serif" }}>
                      {n.description}
                    </div>
                  </div>
                  {active && <ChevronRight size={13} color="#7c5cfc" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Content card */}
          <div
            key={section}
            className="settings-section-content"
            style={{
              background: 'rgba(13,13,22,0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '28px 28px',
              backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* top gradient line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'rgba(124,92,252,0.12)',
                border: '1px solid rgba(124,92,252,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a78bfa',
              }}>
                {activeNav.icon}
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: '#f0eeff', margin: 0, letterSpacing: '-0.02em' }}>
                  {activeNav.label}
                </h2>
                <p style={{ fontSize: 12, color: '#7c7a8e', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                  {activeNav.description}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

            {section === 'profile'     && <ProfileSection     toast={showToast} />}
            {section === 'password'    && <PasswordSection    toast={showToast} />}
            {section === 'artists'     && <ArtistsSection />}
            {section === 'preferences' && <PreferencesSection toast={showToast} />}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </>
  );
}