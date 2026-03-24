'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type DailyStep = 'idle' | 'extracting' | 'preview' | 'saving' | 'done' | 'error';

type MetricKey =
  | 'listeners'
  | 'monthly_active_listeners'
  | 'streams'
  | 'streams_per_listener'
  | 'saves'
  | 'playlist_adds'
  | 'followers';

interface Artist   { id: string; name: string; }
interface DailyRow { date: string; value: number; }
interface ExtractedData { metric: MetricKey; rows: DailyRow[]; }

/* ─── Config ─────────────────────────────────────────────────────────────────── */

const METRICS: { key: MetricKey; label: string; description: string; color: string }[] = [
  { key: 'listeners',                label: 'Listeners',                description: 'Daily',   color: '#34d399' },
  { key: 'monthly_active_listeners', label: 'Monthly Active Listeners', description: 'Monthly', color: '#7c5cfc' },
  { key: 'streams',                  label: 'Streams',                  description: 'Daily',   color: '#a78bfa' },
  { key: 'streams_per_listener',     label: 'Streams / Listener',       description: 'Ratio',   color: '#f59e0b' },
  { key: 'saves',                    label: 'Saves',                    description: 'Daily',   color: '#f472b6' },
  { key: 'playlist_adds',            label: 'Playlist Adds',            description: 'Daily',   color: '#38bdf8' },
  { key: 'followers',                label: 'Followers',                description: 'Daily',   color: '#fb923c' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

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

/* ─── DropZone ───────────────────────────────────────────────────────────────── */

function DropZone({ file, onFile, onClear }: {
  file: File | null; onFile: (f: File) => void; onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag]       = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    onFile(f);
    setPreview(URL.createObjectURL(f));
  }, [onFile]);

  if (file && preview) return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(124,92,252,0.3)' }}>
      <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', background: '#0d0d16', display: 'block' }} />
      <button
        onClick={() => { onClear(); setPreview(null); }}
        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 7, background: 'rgba(13,13,22,0.9)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 14 }}
      >✕</button>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px', background: 'linear-gradient(transparent,rgba(13,13,22,0.9))' }}>
        <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: "'DM Sans',sans-serif" }}>{file.name}</span>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
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
        <p style={{ fontSize: 13, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif", margin: 0 }}>Drop screenshot here or click</p>
        <p style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '3px 0 0' }}>PNG, JPG, WebP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

/* ─── UploadDailyTab ─────────────────────────────────────────────────────────── */

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

const s = step;
const isSaving = step === 'saving';
const isExtracting = step === 'extracting';

  const metricMeta = METRICS.find(m => m.key === metricKey);
  const periodLabel = periodStart && periodEnd ? `${periodStart}_${periodEnd}` : 'custom';

  const dayCount = periodStart && periodEnd
    ? Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) + 1
    : 0;

  /* ── Extract ──────────────────────────────────────────────────────────────── */

  const handleExtract = async () => {
    if (!file || !metricKey || !artistId) return;
    if (!periodStart || !periodEnd) { setErrorMsg('Set the date range before extracting.'); setStep('error'); return; }
    setStep('extracting'); setErrorMsg(''); setExtracted(null);
    try {
      const base64   = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Session expired. Please log in again.');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hyper-worker`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
          body: JSON.stringify({ artist_id: artistId, metric: metricKey, period: periodLabel, period_start: periodStart, period_end: periodEnd, base64, mimeType }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Edge function error: ${res.status}`);
      if (!json.data?.length) throw new Error('No data extracted. Try a clearer screenshot.');
      const rows: DailyRow[] = (json.data as DailyRow[]).filter(r => r.date && r.value != null).sort((a, b) => a.date.localeCompare(b.date));
      setExtracted({ metric: metricKey as MetricKey, rows });
      setEditJson(JSON.stringify(rows, null, 2));
      setSavedCount(json.rows_saved ?? rows.length);
      setStep('preview');
    } catch (err: any) { setErrorMsg(err.message ?? 'Extraction error'); setStep('error'); }
  };

  /* ── Save ─────────────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    if (!extracted || !artistId || !metricKey) return;
    setStep('saving'); setErrorMsg('');
    try {
      let rows: DailyRow[];
      try { rows = JSON.parse(editJson); } catch { throw new Error('Invalid JSON. Check syntax before saving.'); }
      if (!rows.length) throw new Error('No rows to save.');

      let overviewId: number;
      const { data: existing } = await supabase.from('artist_overview').select('id').eq('artist_id', artistId).eq('period', periodLabel).maybeSingle();
      if (existing) {
        overviewId = existing.id;
      } else {
        const { data: created, error: ovErr } = await supabase.from('artist_overview').insert({ artist_id: artistId, period: periodLabel, listeners: 0 }).select('id').single();
        if (ovErr) throw new Error(`Overview error: ${ovErr.message}`);
        overviewId = created.id;
      }

      const upsertRows = rows.map(r => ({
        overview_id: overviewId, artist_id: artistId, date: r.date,
        [metricKey]: metricKey === 'streams_per_listener' ? r.value : Math.round(r.value),
      }));
      const { error: upsertErr } = await supabase.from('artist_overview_daily').upsert(upsertRows, { onConflict: 'overview_id,date', ignoreDuplicates: false });
      if (upsertErr) throw new Error(`Save error: ${upsertErr.message}`);
      setSavedCount(rows.length);
      setStep('done');
    } catch (err: any) { setErrorMsg(err.message ?? 'Save error'); setStep('error'); }
  };

  const reset = () => { setFile(null); setExtracted(null); setEditJson(''); setStep('idle'); setErrorMsg(''); setSavedCount(0); setShowJson(false); };

  /* ── Done ─────────────────────────────────────────────────────────────────── */

  if (s === 'done') return (
    <div className="up-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
      <div>
        <p style={{ fontSize: 18, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0eeff', margin: 0 }}>Saved {savedCount} rows!</p>
        <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '6px 0 0' }}>
          Metric: <span style={{ color: metricMeta?.color }}>{metricMeta?.label}</span>
        </p>
      </div>
      <button className="run-btn" style={{ width: 'auto', padding: '10px 28px', marginTop: 4 }} onClick={reset}>
        Upload another screenshot
      </button>
    </div>
  );

  /* ── Main render ──────────────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Config */}
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
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="up-select" style={{ flex: 1, cursor: 'pointer', colorScheme: 'dark' }} />
              <span style={{ color: '#7c7a8e', fontSize: 14 }}>→</span>
              <input type="date" value={periodEnd}   onChange={e => setPeriodEnd(e.target.value)}   className="up-select" style={{ flex: 1, cursor: 'pointer', colorScheme: 'dark' }} />
            </div>
            {periodStart && periodEnd && (
              <span style={{ fontSize: 11, color: '#a78bfa', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                {dayCount} days · {periodStart} → {periodEnd}
              </span>
            )}
          </div>
        </div>

        {/* Metric chips */}
        <div className="up-field" style={{ marginBottom: 0 }}>
          <label className="up-label">Metric</label>
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

      {/* Screenshot + Extract */}
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
              ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Extracting…</>
              : <>Extract →</>
            }
          </button>
        )}

        {s === 'error' && (
          <div className="err-box" style={{ marginTop: 14 }}>
            ⚠ {errorMsg}
            <button onClick={() => setStep('idle')} style={{ marginLeft: 12, background: 'none', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 6, color: '#f87171', fontSize: 11, padding: '2px 10px', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Preview & Save */}
      {s === 'preview' && extracted && (
        <div className="up-card" style={{ animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <p className="up-card-title" style={{ marginBottom: 0 }}>Preview & Save</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowJson(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#c4c0d8', fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
              >
                {showJson ? 'Hide' : 'Edit'} JSON
              </button>
              <button
                onClick={reset}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: metricMeta?.color, fontFamily: "'Syne',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {extracted.rows.length} rows extracted
              </span>
              <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>
                {extracted.rows[0]?.date} → {extracted.rows[extracted.rows.length - 1]?.date}
              </span>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '7px 14px', fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    <th style={{ padding: '7px 14px', fontSize: 10, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", textAlign: 'right', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {extracted.rows.map((row, i) => (
                    <tr key={row.date} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '7px 14px', fontSize: 12, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif" }}>{row.date}</td>
                      <td style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, color: metricMeta?.color, fontFamily: "'Syne',sans-serif", textAlign: 'right' }}>{fmt(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showJson && (
            <div style={{ marginBottom: 14 }}>
              <textarea
                value={editJson}
                onChange={e => setEditJson(e.target.value)}
                spellCheck={false}
                style={{ width: '100%', minHeight: 180, maxHeight: 320, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#a5f3a5', fontFamily: "'Courier New',monospace", fontSize: 11, padding: 12, resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 11, color: '#7c7a8e', marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>✏️ You can correct dates or values before saving.</p>
            </div>
          )}

          <button
            className="run-btn"
            disabled={isSaving}
            onClick={handleSave}
            style={{ background: '#059669', boxShadow: '0 0 20px rgba(5,150,105,0.35)' }}
          >
            {isSaving
              ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</>
              : <>Save {extracted.rows.length} rows to Supabase →</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function AdminDailyPage() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    supabase.from('artists').select('id, name').order('name')
      .then(({ data }) => setArtists(data ?? []));
  }, []);

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 800, color: '#f0eeff', letterSpacing: '-0.03em', margin: 0 }}>
          Upload Daily Metrics
        </h1>
        <p style={{ fontSize: 13, color: '#7c7a8e', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>
          Import daily chart data from Spotify for Artists screenshots
        </p>
      </div>
      <UploadDailyTab artists={artists} />
    </>
  );
}