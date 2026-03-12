'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import UsersTab from './components/UsersTab';
import UploadTab from './components/UploadTab';
import UploadTracksTab from './components/Uploadtrackstab';

// ─── Types ─────────────────────────────────────────────────────────────────────

type AdminTab = 'users' | 'upload' | 'daily' | 'tracks';

type DailyStep = 'idle' | 'extracting' | 'preview' | 'saving' | 'done' | 'error';

type MetricKey =
  | 'listeners'
  | 'monthly_active_listeners'
  | 'streams'
  | 'streams_per_listener'
  | 'saves'
  | 'playlist_adds'
  | 'followers';

interface Artist { id: string; name: string; }
interface DailyRow { date: string; value: number; }
interface ExtractedData { metric: MetricKey; rows: DailyRow[]; }

// ─── Config ────────────────────────────────────────────────────────────────────

const METRICS: { key: MetricKey; label: string; description: string; color: string }[] = [
  { key: 'listeners',                label: 'Listeners',               description: 'Daily',    color: '#34d399' },
  { key: 'monthly_active_listeners', label: 'Monthly Active Listeners', description: 'Monthly',       color: '#7c5cfc' },
  { key: 'streams',                  label: 'Streams',                  description: 'Daily',        color: '#a78bfa' },
  { key: 'streams_per_listener',     label: 'Streams / Listener',       description: 'Balance', color: '#f59e0b' },
  { key: 'saves',                    label: 'Saves',                    description: 'Daily',           color: '#f472b6' },
  { key: 'playlist_adds',            label: 'Playlist Adds',            description: 'Daily', color: '#38bdf8' },
  { key: 'followers',                label: 'Followers',                description: 'Daily',      color: '#fb923c' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res((r.result as string).split(',')[1]);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({ file, onFile, onClear }: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    onFile(f);
    setPreview(URL.createObjectURL(f));
  }, [onFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  if (file && preview) {
    return (
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(124,92,252,0.3)' }}>
        <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', background: '#0d0d16', display: 'block' }} />
        <button onClick={() => { onClear(); setPreview(null); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 7, background: 'rgba(13,13,22,0.9)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 14 }}>✕</button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px', background: 'linear-gradient(transparent,rgba(13,13,22,0.9))' }}>
          <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: "'DM Sans',sans-serif" }}>{file.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${drag ? 'rgba(124,92,252,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, padding: '32px 20px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: drag ? 'rgba(124,92,252,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif", margin: 0 }}>Add the screenshot here</p>
        <p style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '3px 0 0' }}>or click here · PNG, JPG, WebP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ─── DataPreviewTable ──────────────────────────────────────────────────────────

function DataPreviewTable({ rows, metric }: { rows: DailyRow[]; metric: MetricKey }) {
  const color = METRICS.find(m => m.key === metric)?.color ?? '#a78bfa';
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'Syne',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rows.length} righe estratte</span>
        <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>{rows[0]?.date} → {rows[rows.length - 1]?.date}</span>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '7px 14px', fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
              <th style={{ padding: '7px 14px', fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", textAlign: 'right', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valore</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.date} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '7px 14px', fontSize: 12, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif" }}>{row.date}</td>
                <td style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, color, fontFamily: "'Syne',sans-serif", textAlign: 'right' }}>{fmt(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── UploadDailyTab ────────────────────────────────────────────────────────────

function UploadDailyTab({ artists }: { artists: Artist[] }) {
  const [artistId,    setArtistId]    = useState('');
  const [metricKey,   setMetricKey]   = useState<MetricKey | ''>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd,   setPeriodEnd]   = useState('');
  const [file,        setFile]        = useState<File | null>(null);
  const [extracted,   setExtracted]   = useState<ExtractedData | null>(null);
  const [editJson,    setEditJson]    = useState('');
  const [showJson,    setShowJson]    = useState(false);
  const [step,        setStep]        = useState<DailyStep>('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [savedCount,  setSavedCount]  = useState(0);

  const s: string  = step;
  const ss: string = step;
  const metricMeta = METRICS.find(m => m.key === metricKey);
  const periodLabel = periodStart && periodEnd ? `${periodStart}_${periodEnd}` : 'custom';

  // ── Extract + Save via Edge Function ────────────────────────────────────────

  const handleExtract = async () => {
    if (!file || !metricKey || !artistId) return;
    if (!periodStart || !periodEnd) {
      setErrorMsg('Inserisci il range di date prima di estrarre.');
      setStep('error');
      return;
    }
    setStep('extracting'); setErrorMsg(''); setExtracted(null);
    try {
      const base64   = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sessione scaduta. Effettua nuovamente il login.');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hyper-worker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            artist_id:    artistId,
            metric:       metricKey,
            period:       periodLabel,
            period_start: periodStart || null,
            period_end:   periodEnd   || null,
            base64,
            mimeType,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Edge function error: ${res.status}`);
      if (!json.data?.length) throw new Error('Nessun dato estratto. Prova con uno screenshot più chiaro.');

      const rows: DailyRow[] = (json.data as DailyRow[])
        .filter(r => r.date && r.value != null)
        .sort((a, b) => a.date.localeCompare(b.date));

      setExtracted({ metric: metricKey as MetricKey, rows });
      setEditJson(JSON.stringify(rows, null, 2));
      setSavedCount(json.rows_saved ?? rows.length);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message ?? "Errore durante l'estrazione");
      setStep('error');
    }
  };

  // ── Confirm save (re-upsert edited JSON if user changed it) ─────────────────

  const handleSave = async () => {
    if (!extracted || !artistId || !metricKey) return;
    setStep('saving'); setErrorMsg('');
    try {
      let rows: DailyRow[];
      try { rows = JSON.parse(editJson); }
      catch { throw new Error('JSON non valido. Controlla la sintassi prima di salvare.'); }
      if (!rows.length) throw new Error('Nessuna riga da salvare.');

      const periodStr = periodLabel;

      // Get or create artist_overview
      let overviewId: number;
      const { data: existing } = await supabase
        .from('artist_overview')
        .select('id')
        .eq('artist_id', artistId)
        .eq('period', periodStr)
        .maybeSingle();

      if (existing) {
        overviewId = existing.id;
      } else {
        const { data: created, error: ovErr } = await supabase
          .from('artist_overview')
          .insert({ artist_id: artistId, period: periodStr, listeners: 0 })
          .select('id')
          .single();
        if (ovErr) throw new Error(`Errore overview: ${ovErr.message}`);
        overviewId = created.id;
      }

      const upsertRows = rows.map(r => ({
        overview_id: overviewId,
        artist_id:   artistId,
        date:        r.date,
        [metricKey]: metricKey === 'streams_per_listener' ? r.value : Math.round(r.value),
      }));

      const { error: upsertErr } = await supabase
        .from('artist_overview_daily')
        .upsert(upsertRows, { onConflict: 'overview_id,date', ignoreDuplicates: false });

      if (upsertErr) throw new Error(`Errore salvataggio: ${upsertErr.message}`);
      setSavedCount(rows.length);
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Errore durante il salvataggio');
      setStep('error');
    }
  };

  const reset = () => {
    setFile(null); setExtracted(null); setEditJson('');
    setStep('idle'); setErrorMsg(''); setSavedCount(0); setShowJson(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (s === 'done') return (
    <div className="up-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
      <div>
        <p style={{ fontSize: 18, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0eeff', margin: 0 }}>Salvate {savedCount} righe!</p>
        <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '6px 0 0' }}>
          Metrica: <span style={{ color: metricMeta?.color }}>{metricMeta?.label}</span>
        </p>
      </div>
      <button className="run-btn" style={{ width: 'auto', padding: '10px 28px', marginTop: 4 }} onClick={reset}>
       Upload another screenshot
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Config row ── */}
      <div className="up-card">
        <p className="up-card-title">Configuration</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
          {/* Artist */}
          <div className="up-field">
            <label className="up-label">Artist</label>
            <select className="up-select" value={artistId} onChange={e => setArtistId(e.target.value)}>
              <option value="">— select artist —</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {/* Period */}
          <div className="up-field">
            <label className="up-label">Period</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  type="date"
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                  className="up-select"
                  style={{ cursor: 'pointer', colorScheme: 'dark' }}
                />
              </div>
              <span style={{ color: '#7c7a8e', fontSize: 14, marginTop: 18 }}>→</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  className="up-select"
                  style={{ cursor: 'pointer', colorScheme: 'dark' }}
                />
              </div>
            </div>
            {periodStart && periodEnd && (
              <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                {(() => {
                  const d1 = new Date(periodStart), d2 = new Date(periodEnd);
                  const days = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
                  return `${days} giorni · ${periodStart} → ${periodEnd}`;
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Metric chips */}
        <div className="up-field" style={{ marginBottom: 0 }}>
          <label className="up-label">Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px,1fr))', gap: 8, marginTop: 4 }}>
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetricKey(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 13px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, textAlign: 'left',
                  background: metricKey === m.key ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${metricKey === m.key ? m.color + '55' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, boxShadow: metricKey === m.key ? `0 0 8px ${m.color}` : 'none' }} />
                <div>
                  <div style={{ fontWeight: 600, color: metricKey === m.key ? '#f0eeff' : '#c4c0d8' }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: '#7c7a8e', marginTop: 1 }}>{m.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upload + Extract ── */}
      <div className="up-card">
        <p className="up-card-title">Screenshot</p>
        <DropZone
          file={file}
          onFile={f => { setFile(f); setStep('idle'); setExtracted(null); }}
          onClear={() => { setFile(null); setStep('idle'); setExtracted(null); }}
        />

        {s !== 'preview' && (
          <button
            className="run-btn"
            disabled={!artistId || !metricKey || !file || !periodStart || !periodEnd || s === 'extracting'}
            onClick={handleExtract}
            style={{ marginTop: 16 }}
          >
            {s === 'extracting'
              ? <><span className="spin-slow" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> Estrazione in corso…</>
              : <>Extract →</>
            }
          </button>
        )}

        {/* Error */}
        {s === 'error' && (
          <div className="err-box" style={{ marginTop: 14 }}>
            ⚠ {errorMsg}
            <button onClick={() => setStep('idle')} style={{ marginLeft: 12, background: 'none', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 6, color: '#f87171', fontSize: 11, padding: '2px 10px', cursor: 'pointer' }}>Riprova</button>
          </div>
        )}
      </div>

      {/* ── Preview & Save ── */}
      {s === 'preview' && extracted && (
        <div className="up-card" style={{ animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <p className="up-card-title" style={{ marginBottom: 0 }}>③ Anteprima & Salvataggio</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowJson(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#c4c0d8', fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
              >
                {showJson ? 'Nascondi' : 'Modifica'} JSON
              </button>
              <button
                onClick={reset}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
              >
                Ricomincia
              </button>
            </div>
          </div>

          <DataPreviewTable rows={extracted.rows} metric={extracted.metric} />

          {showJson && (
            <div style={{ marginTop: 14 }}>
              <textarea
                value={editJson}
                onChange={e => setEditJson(e.target.value)}
                spellCheck={false}
                style={{ width: '100%', minHeight: 180, maxHeight: 320, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#a5f3a5', fontFamily: "'Courier New',monospace", fontSize: 11, padding: 12, resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 11, color: '#7c7a8e', marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>✏️ Puoi correggere date o valori prima di salvare.</p>
            </div>
          )}

          <button
            className="run-btn"
            disabled={ss === 'saving'}
            onClick={handleSave}
            style={{ marginTop: 16, background: '#059669', boxShadow: '0 0 20px rgba(5,150,105,0.35)' }}
          >
            {ss === 'saving'
              ? <><span className="spin-slow" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> Salvataggio…</>
              : <>Salva {extracted.rows.length} righe su Supabase →</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AdminPage ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab,     setTab]     = useState<AdminTab>('users');
  const [ready,   setReady]   = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile?.role !== 'admin') { router.push('/dashboard'); return; }

      const { data: artistData } = await supabase
        .from('artists').select('id, name').order('name');
      setArtists(artistData ?? []);
      setReady(true);
    })();
  }, [router]);

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#05050a' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(124,92,252,0.2)', borderTop: '2px solid #7c5cfc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #05050a; }

        .admin-root { min-height:100vh; background:#05050a; color:#f0eeff; font-family:'DM Sans',sans-serif; -webkit-font-smoothing:antialiased; }
        .admin-topbar { height:60px; display:flex; align-items:center; justify-content:space-between; padding:0 32px; background:rgba(8,8,16,0.9); border-bottom:1px solid rgba(255,255,255,0.06); backdrop-filter:blur(20px); position:sticky; top:0; z-index:50; }
        .admin-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .admin-logo-icon { width:28px; height:28px; border-radius:9px; background:linear-gradient(135deg,#7c5cfc,#c084fc); display:flex; align-items:center; justify-content:center; }
        .admin-logo-text { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; }
        .admin-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:100px; background:rgba(124,92,252,0.15); border:1px solid rgba(124,92,252,0.3); color:#a78bfa; letter-spacing:0.08em; text-transform:uppercase; }
        .admin-body { max-width:1200px; margin:0 auto; padding:40px 32px; }
        .admin-page-title { font-family:'Syne',sans-serif; font-size:clamp(22px,3vw,30px); font-weight:800; letter-spacing:-0.03em; color:#f0eeff; }
        .admin-page-sub { font-size:13px; color:#7c7a8e; margin-top:6px; font-weight:300; }

        .admin-tabs { display:flex; gap:4px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:4px; width:fit-content; margin:28px 0 32px; }
        .admin-tab { display:flex; align-items:center; gap:8px; padding:9px 20px; border-radius:10px; border:none; cursor:pointer; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; transition:all 0.15s; background:transparent; color:#7c7a8e; }
        .admin-tab:hover { color:#c4c0d8; background:rgba(255,255,255,0.05); }
        .admin-tab.active { background:#7c5cfc; color:#fff; box-shadow:0 2px 12px rgba(124,92,252,0.45); }

        /* shared card + form styles reused by UploadDailyTab and UploadTab */
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; opacity:0; }
        .d1{animation-delay:0.04s} .d2{animation-delay:0.10s}
        .spin-slow { animation:spin-slow 2s linear infinite; }

        .up-card { background:rgba(13,13,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:24px; backdrop-filter:blur(16px); position:relative; overflow:hidden; }
        .up-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(124,92,252,0.5) 40%,rgba(167,139,250,0.5) 60%,transparent); }
        .up-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .up-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .up-label { font-size:11px; font-weight:600; color:#7c7a8e; letter-spacing:0.07em; text-transform:uppercase; }
        .up-select { width:100%; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#f0eeff; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; appearance:none; cursor:pointer; transition:border-color 0.2s,box-shadow 0.2s; }
        .up-select:focus { border-color:rgba(124,92,252,0.6); box-shadow:0 0 0 3px rgba(124,92,252,0.1); }
        .upload-zone { cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:36px 20px; border:2px dashed rgba(124,92,252,0.25); border-radius:16px; transition:all 0.2s; background:rgba(124,92,252,0.04); }
        .upload-zone:hover, .upload-zone.over { background:rgba(124,92,252,0.09); border-color:rgba(124,92,252,0.6); }
        .file-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-top:16px; }
        .file-item { position:relative; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); }
        .file-item:hover .file-remove { opacity:1; }
        .file-thumb { width:100%; height:88px; object-fit:cover; display:block; }
        .file-name { padding:6px 8px; font-size:11px; color:#7c7a8e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .file-remove { position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:6px; border:none; background:rgba(0,0,0,0.75); color:#f87171; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
        .run-btn { width:100%; padding:12px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; transition:background 0.15s; box-shadow:0 0 20px rgba(124,92,252,0.35); display:flex; align-items:center; justify-content:center; gap:8px; }
        .run-btn:hover:not(:disabled) { background:#9370ff; }
        .run-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .up-grid { display:grid; grid-template-columns:280px 1fr; gap:24px; align-items:start; }
        @media(max-width:860px) { .up-grid { grid-template-columns:1fr; } }
        .info-box { padding:12px 14px; border-radius:10px; margin-top:4px; background:rgba(124,92,252,0.06); border:1px solid rgba(124,92,252,0.15); font-size:12px; color:#7c7a8e; line-height:1.65; }
        .info-box strong { display:block; font-size:10px; color:#a78bfa; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px; }
        .info-type { display:flex; align-items:center; gap:7px; padding:5px 0; font-size:12px; color:#7c7a8e; border-bottom:1px solid rgba(255,255,255,0.04); }
        .info-type:last-child { border-bottom:none; }
        .info-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .err-box { padding:10px 14px; border-radius:10px; margin-bottom:16px; background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.25); color:#f87171; font-size:13px; }
        .steps { display:flex; align-items:center; gap:8px; margin-bottom:28px; }
        .step-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:'Syne',sans-serif; transition:all 0.25s; }
        .step-dot.active { background:#7c5cfc; color:#fff; box-shadow:0 0 12px rgba(124,92,252,0.5); }
        .step-dot.done { background:rgba(52,211,153,0.2); color:#34d399; border:1px solid rgba(52,211,153,0.3); }
        .step-dot.idle { background:rgba(255,255,255,0.06); color:#7c7a8e; }
        .step-line { flex:1; height:1px; background:rgba(255,255,255,0.08); max-width:40px; }
        .processing-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:20px; text-align:center; }
        .result-item { border-radius:14px; padding:16px 18px; margin-bottom:10px; }
        .result-ok { background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.2); }
        .result-err { background:rgba(248,113,113,0.07); border:1px solid rgba(248,113,113,0.2); }
        .result-fname { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; margin-bottom:4px; }
        .result-ok .result-fname { color:#34d399; }
        .result-err .result-fname { color:#f87171; }
        .type-badge { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-left:8px; }
        .json-pre { background:rgba(0,0,0,0.4); border-radius:8px; padding:10px 12px; margin-top:8px; font-family:'Courier New',monospace; font-size:11px; color:#a78bfa; overflow-x:auto; white-space:pre-wrap; max-height:180px; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); }
        .done-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:24px; text-align:center; }
        .done-icon { width:56px; height:56px; border-radius:50%; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); display:flex; align-items:center; justify-content:center; font-size:22px; }
        .reset-btn { padding:10px 28px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; box-shadow:0 0 20px rgba(124,92,252,0.35); transition:background 0.15s; }
        .reset-btn:hover { background:#9370ff; }
      `}</style>

      <div className="admin-root">
        <header className="admin-topbar">
          <a href="/dashboard" className="admin-logo">
            <div className="admin-logo-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h3l2-4 2 8 2-4h1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="admin-logo-text">Pulse</span>
          </a>
          <span className="admin-badge">Admin Panel</span>
        </header>

        <div className="admin-body">
          <h1 className="admin-page-title">Admin Panel</h1>
          <p className="admin-page-sub">Manage users, artists and upload new data.</p>

          <div className="admin-tabs">
            {([
              { id: 'users',  label: 'Users & Artists' },
              { id: 'upload', label: 'Upload Screenshots' },
              { id: 'daily',  label: 'Upload Daily' },
              { id: 'tracks', label: 'Import Tracks' }
            ] as { id: AdminTab; label: string }[]).map(t => (
              <button
                key={t.id}
                className={`admin-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'users'  && <UsersTab />}
          {tab === 'upload' && <UploadTab />}
          {tab === 'daily'  && <UploadDailyTab artists={artists} />}
          {tab === 'tracks' && <UploadTracksTab artists={artists} />}

        </div>
      </div>
    </>
  );
}