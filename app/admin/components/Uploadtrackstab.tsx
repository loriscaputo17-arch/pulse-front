'use client';
import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Artist { id: string; name: string; }

interface TrackRow {
  title:         string;
  streams:       number;
  listeners:     number;
  saves:         number;
  playlist_adds: number;
  release_date:  string | null;
}

type Step = 'idle' | 'extracting' | 'preview' | 'saving' | 'done' | 'error';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res((r.result as string).split(',')[1]);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('it-IT');
}

// ─── Gemini ────────────────────────────────────────────────────────────────────

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const EXTRACTION_PROMPT = `
You are a data extraction assistant analyzing a Spotify for Artists screenshot.
The screenshot shows a list of tracks with their stats.

Extract ALL visible tracks and return ONLY a valid JSON array — no markdown, no explanation.

Each element must have these fields:
{
  "title":         string   — track title exactly as shown,
  "streams":       number   — total streams (convert 1.2k → 1200, 1.5M → 1500000, round to integer),
  "listeners":     number   — listeners if visible, else 0,
  "saves":         number   — saves if visible, else 0,
  "playlist_adds": number   — playlist adds if visible, else 0,
  "release_date":  string|null — release date in YYYY-MM-DD format if visible, else null
}

Rules:
- Return [] if nothing is readable.
- Do NOT invent values. Use 0 for metrics not visible in the screenshot.
- Preserve exact track titles including featuring artists, "ft.", parentheses, etc.
- Numbers only — no units, no commas (e.g. 12400 not "12,400" or "12.4k").

Example:
[
  { "title": "Song Name (feat. Artist)", "streams": 125000, "listeners": 43000, "saves": 3200, "playlist_adds": 800, "release_date": "2024-03-15" }
]
`;

async function extractTracksFromImage(
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<TrackRow[]> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) throw new Error('Gemini API error: ' + await res.text());
  const json = await res.json();
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty Gemini response');

  const cleaned = text.trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed.map((r: any) => ({
      title:         String(r.title ?? '').trim(),
      streams:       Math.round(Number(r.streams ?? 0)),
      listeners:     Math.round(Number(r.listeners ?? 0)),
      saves:         Math.round(Number(r.saves ?? 0)),
      playlist_adds: Math.round(Number(r.playlist_adds ?? 0)),
      release_date:  r.release_date ? String(r.release_date) : null,
    })).filter(r => r.title.length > 0);
  } catch {
    // Attempt partial recovery
    const matches = cleaned.match(/\{[^}]+\}/g);
    if (matches?.length) {
      try {
        return JSON.parse('[' + matches.join(',') + ']');
      } catch { /* fall through */ }
    }
    throw new Error('Could not parse Gemini response as JSON');
  }
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

  if (file && preview) {
    return (
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(124,92,252,0.3)' }}>
        <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#0d0d16', display: 'block' }} />
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
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      style={{
        border: `2px dashed ${drag ? 'rgba(124,92,252,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, padding: '36px 20px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: drag ? 'rgba(124,92,252,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎵</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif", margin: 0 }}>Add screenshot</p>
        <p style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '3px 0 0' }}>or click · PNG, JPG, WebP</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ─── EditableCell ──────────────────────────────────────────────────────────────

function EditableCell({ value, onChange, type = 'text', align = 'left' }: {
  value: string | number | null;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'date';
  align?: 'left' | 'right';
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(String(value ?? ''));

  const commit = () => { setEditing(false); onChange(draft); };

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); } }}
        style={{ width: '100%', background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.5)', borderRadius: 6, color: '#f0eeff', fontSize: 12, padding: '3px 7px', fontFamily: "'DM Sans',sans-serif", outline: 'none', textAlign: align }}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
      title="Click to edit"
      style={{ cursor: 'pointer', display: 'block', padding: '3px 4px', borderRadius: 5, fontSize: 12, color: '#c4c0d8', fontFamily: "'DM Sans',sans-serif", textAlign: align, transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {type === 'number' ? fmt(Number(value ?? 0)) : (value || <span style={{ color: '#7c7a8e' }}>—</span>)}
    </span>
  );
}

// ─── PreviewTable ──────────────────────────────────────────────────────────────

function PreviewTable({ rows, onChange, onRemove }: {
  rows: TrackRow[];
  onChange: (i: number, field: keyof TrackRow, val: string) => void;
  onRemove: (i: number) => void;
}) {
  const cols: { key: keyof TrackRow; label: string; type: 'text' | 'number' | 'date'; align: 'left' | 'right' }[] = [
    { key: 'title',         label: 'Title',         type: 'text',   align: 'left'  },
    { key: 'streams',       label: 'Streams',       type: 'number', align: 'right' },
    { key: 'listeners',     label: 'Listeners',     type: 'number', align: 'right' },
    { key: 'saves',         label: 'Saves',         type: 'number', align: 'right' },
    { key: 'playlist_adds', label: 'Playlist Adds', type: 'number', align: 'right' },
    { key: 'release_date',  label: 'Release Date',  type: 'date',   align: 'left'  },
  ];

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px', gap: 0, padding: '9px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {cols.map(c => (
          <span key={c.key} style={{ fontSize: 10, fontWeight: 700, color: '#7c7a8e', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Sans',sans-serif", textAlign: c.align }}>
            {c.label}
          </span>
        ))}
        <span />
      </div>
      {/* rows */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px',
              gap: 0, padding: '7px 14px', alignItems: 'center',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,92,252,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
          >
            {cols.map(c => (
              <EditableCell
                key={c.key}
                value={row[c.key] as string | number | null}
                type={c.type}
                align={c.align}
                onChange={val => onChange(i, c.key, val)}
              />
            ))}
            <button
              onClick={() => onRemove(i)}
              title="Remove row"
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#7c7a8e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7c7a8e'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >✕</button>
          </div>
        ))}
      </div>
      <div style={{ padding: '9px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif" }}>{rows.length} tracce · click su una cella per modificarla</span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UploadTracksTab({ artists }: { artists: Artist[] }) {
  const [artistId, setArtistId] = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [rows,     setRows]     = useState<TrackRow[]>([]);
  const [step,     setStep]     = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saved,    setSaved]    = useState(0);
  const [mode,     setMode]     = useState<'upsert' | 'insert'>('upsert');

  const handleExtract = async () => {
    if (!file || !artistId) return;
    setStep('extracting'); setErrorMsg('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY non configurata');

      const base64   = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const extracted = await extractTracksFromImage(base64, mimeType, apiKey);

      if (!extracted.length) throw new Error('Nessuna traccia trovata. Prova con uno screenshot più chiaro.');

      setRows(extracted);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Errore durante estrazione');
      setStep('error');
    }
  };

  const handleCellChange = (i: number, field: keyof TrackRow, val: string) => {
    setRows(prev => {
      const next = [...prev];
      const row  = { ...next[i] };
      if (field === 'title' || field === 'release_date') {
        (row as any)[field] = val || null;
      } else {
        (row as any)[field] = Math.round(Number(val) || 0);
      }
      next[i] = row;
      return next;
    });
  };

  const handleRemoveRow = (i: number) => {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!rows.length || !artistId) return;
    setStep('saving'); setErrorMsg('');

    try {
      const upsertRows = rows
        .filter(r => r.title.trim())
        .map(r => ({
          artist_id:     artistId,
          title:         r.title.trim(),
          streams:       r.streams,
          listeners:     r.listeners,
          saves:         r.saves,
          playlist_adds: r.playlist_adds,
          release_date:  r.release_date || null,
          image_url:     null,
        }));

      if (!upsertRows.length) throw new Error('Nessuna riga valida da salvare.');

      if (mode === 'upsert') {
        // Upsert matching on artist_id + title
        const { error } = await supabase
          .from('tracks')
          .upsert(upsertRows, { onConflict: 'artist_id,title', ignoreDuplicates: false });
        if (error) throw new Error(error.message);
      } else {
        // Plain insert
        const { error } = await supabase.from('tracks').insert(upsertRows);
        if (error) throw new Error(error.message);
      }

      setSaved(upsertRows.length);
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Errore durante il salvataggio');
      setStep('error');
    }
  };

  const reset = () => {
    setFile(null); setRows([]); setStep('idle');
    setErrorMsg(''); setSaved(0);
  };

  // ── Done ──────────────────────────────────────────────────────────────────

  if (step === 'done') {
    const artist = artists.find(a => a.id === artistId);
    return (
      <div className="up-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div>
        <div>
          <p style={{ fontSize: 18, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0eeff', margin: 0 }}>
            {saved} tracce salvate!
          </p>
          <p style={{ fontSize: 13, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", margin: '6px 0 0' }}>
            Artista: <span style={{ color: '#a78bfa' }}>{artist?.name}</span> · modalità: <span style={{ color: '#34d399' }}>{mode}</span>
          </p>
        </div>
        <button className="run-btn" style={{ width: 'auto', padding: '10px 28px', marginTop: 4 }} onClick={reset}>
          Importa altro screenshot
        </button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Step 1: Config ── */}
      <div className="up-card">
        <p className="up-card-title">Configuration</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 }}>

          {/* Artist */}
          <div className="up-field">
            <label className="up-label">Artist</label>
            <select className="up-select" value={artistId} onChange={e => setArtistId(e.target.value)}>
              <option value="">— select artist —</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Mode */}
          <div className="up-field">
            <label className="up-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['upsert', 'insert'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${mode === m ? (m === 'upsert' ? '#34d39955' : '#a78bfa55') : 'rgba(255,255,255,0.07)'}`,
                    background: mode === m ? (m === 'upsert' ? 'rgba(52,211,153,0.08)' : 'rgba(124,92,252,0.10)') : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
                    color: mode === m ? (m === 'upsert' ? '#34d399' : '#a78bfa') : '#7c7a8e',
                    transition: 'all 0.15s',
                  }}
                >
                  {m === 'upsert' ? '↻ Upsert' : '＋ Insert'}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#7c7a8e', fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
              {mode === 'upsert'
                ? 'Update tracks or create a new row.'
                : 'Insert new rows.'}
            </span>
          </div>
        </div>

        {/* Info box */}
        <div className="info-box" style={{ marginTop: 4 }}>
          <strong>Extracted fields</strong>
          {[
            { color: '#f0eeff', label: 'Title',         desc: 'Track name' },
            { color: '#34d399', label: 'Streams',        desc: 'Total stream' },
            { color: '#a78bfa', label: 'Listeners',      desc: 'Unique listeners' },
            { color: '#f472b6', label: 'Saves',          desc: 'Savings' },
            { color: '#38bdf8', label: 'Playlist Adds',  desc: 'Playlist adds' },
            { color: '#f59e0b', label: 'Release Date',   desc: 'Release date' },
          ].map(f => (
            <div key={f.label} className="info-type">
              <div className="info-dot" style={{ background: f.color }} />
              <span style={{ color: f.color, fontWeight: 600, minWidth: 100 }}>{f.label}</span>
              <span>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 2: Screenshot ── */}
      <div className="up-card">
        <p className="up-card-title">Screenshot</p>
        <DropZone
          file={file}
          onFile={f => { setFile(f); setStep('idle'); setRows([]); }}
          onClear={() => { setFile(null); setStep('idle'); setRows([]); }}
        />

        {step !== 'preview' && (
          <button
            className="run-btn"
            disabled={!artistId || !file || step === 'extracting'}
            onClick={handleExtract}
            style={{ marginTop: 16 }}
          >
            {step === 'extracting'
              ? <><span className="spin-slow" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%' }} /> Estrazione in corso…</>
              : <>Extract tracks →</>
            }
          </button>
        )}

        {step === 'error' && (
          <div className="err-box" style={{ marginTop: 14 }}>
            ⚠ {errorMsg}
            <button onClick={() => setStep('idle')} style={{ marginLeft: 12, background: 'none', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 6, color: '#f87171', fontSize: 11, padding: '2px 10px', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Step 3: Preview & Save ── */}
      {step === 'preview' && rows.length > 0 && (
        <div className="up-card" style={{ animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <p className="up-card-title" style={{ marginBottom: 0 }}>
              Preview — {rows.length} extracted tracks
            </p>
            <button
              onClick={reset}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
            >
              Restart
            </button>
          </div>

          <PreviewTable rows={rows} onChange={handleCellChange} onRemove={handleRemoveRow} />

          <button
            className="run-btn"
            onClick={handleSave}
            style={{ marginTop: 16, background: '#059669', boxShadow: '0 0 20px rgba(5,150,105,0.35)' }}
          >
            <>Save {rows.length} tracks ({mode}) →</>
          </button>
        </div>
      )}
    </div>
  );
}