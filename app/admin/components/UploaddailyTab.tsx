"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Step = "upload" | "processing" | "review" | "done";

interface Artist { id: string; name: string; }
interface UploadedFile { id: string; file: File; name: string; preview: string; }
interface ExtractionResult {
  fileName: string;
  status: "success" | "error";
  type?: string;
  data?: any;
  error?: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  overview:       { label: "Audience Overview",    color: "#a78bfa" },
  overview_daily: { label: "Daily Breakdown",       color: "#60a5fa" },
  segments:       { label: "Audience Segments",     color: "#34d399" },
  demographics:   { label: "Demographics",          color: "#f59e0b" },
  location:       { label: "Location",              color: "#f87171" },
  tracks:         { label: "Tracks",                color: "#e879f9" },
};

export default function UploadTab() {
  const [artists,  setArtists]  = useState<Artist[]>([]);
  const [artistId, setArtistId] = useState("");
  const [step,     setStep]     = useState<Step>("upload");
  const [files,    setFiles]    = useState<UploadedFile[]>([]);
  const [results,  setResults]  = useState<ExtractionResult[]>([]);
  const [error,    setError]    = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("artists").select("id, name").order("name")
      .then(({ data }) => setArtists(data ?? []));
  }, []);

  function handleFiles(input: FileList | null) {
    if (!input) return;
    const next: UploadedFile[] = Array.from(input)
      .filter(f => f.type.startsWith("image/"))
      .map(f => ({ id: crypto.randomUUID(), file: f, name: f.name, preview: URL.createObjectURL(f) }));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...next.filter(f => !existing.has(f.name))];
    });
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = () => res((reader.result as string).split(",")[1]);
      reader.onerror = () => rej(new Error("Read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function runAi() {
    try {
      setError(null);
      setStep("processing");

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.access_token) throw new Error("No active session");

      const payload = await Promise.all(
        files.map(async (f) => ({
          name:     f.name,
          base64:   await fileToBase64(f.file),
          mimeType: f.file.type || "image/jpeg",
        }))
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/extract-screenshot-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({ artist_id: artistId, files: payload }),
        }
      );

      if (!res.ok) { const txt = await res.text(); throw new Error(txt || "Edge function failed"); }
      const json = await res.json();
      setResults(json.results ?? []);
      setStep("review");
    } catch (err: any) {
      setError(err?.message ?? "Processing failed");
      setStep("upload");
    }
  }

  function reset() {
    setStep("upload"); setFiles([]); setResults([]); setError(null);
  }

  const successCount = results.filter(r => r.status === "success").length;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .d1{animation-delay:0.04s} .d2{animation-delay:0.10s}
        .spin-slow { animation: spin-slow 2s linear infinite; }

        .up-card {
          background: rgba(13,13,22,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px; padding: 24px; backdrop-filter: blur(16px);
          position: relative; overflow: hidden;
        }
        .up-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5) 40%, rgba(167,139,250,0.5) 60%, transparent);
        }
        .up-card-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; color:#f0eeff; letter-spacing:-0.02em; margin-bottom:20px; }
        .up-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .up-label { font-size:11px; font-weight:600; color:#7c7a8e; letter-spacing:0.07em; text-transform:uppercase; }
        .up-select {
          width:100%; padding:10px 14px; border-radius:10px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          color:#f0eeff; font-size:13px; font-family:'DM Sans',sans-serif;
          outline:none; appearance:none; cursor:pointer; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .up-select:focus { border-color:rgba(124,92,252,0.6); box-shadow:0 0 0 3px rgba(124,92,252,0.1); }

        .upload-zone { cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:36px 20px; border:2px dashed rgba(124,92,252,0.25); border-radius:16px; transition:all 0.2s; background:rgba(124,92,252,0.04); }
        .upload-zone:hover, .upload-zone.over { background:rgba(124,92,252,0.09); border-color:rgba(124,92,252,0.6); }
        .upload-icon { width:48px; height:48px; border-radius:50%; border:1px solid rgba(124,92,252,0.3); display:flex; align-items:center; justify-content:center; font-size:20px; }

        .file-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-top:16px; }
        .file-item { position:relative; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); }
        .file-item:hover .file-remove { opacity:1; }
        .file-thumb { width:100%; height:88px; object-fit:cover; display:block; }
        .file-name { padding:6px 8px; font-size:11px; color:#7c7a8e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .file-remove { position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:6px; border:none; background:rgba(0,0,0,0.75); color:#f87171; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }

        .run-btn { width:100%; padding:12px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; transition:background 0.15s; box-shadow:0 0 20px rgba(124,92,252,0.35); display:flex; align-items:center; justify-content:center; gap:8px; margin-top:16px; }
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
        .step-dot.done   { background:rgba(52,211,153,0.2); color:#34d399; border:1px solid rgba(52,211,153,0.3); }
        .step-dot.idle   { background:rgba(255,255,255,0.06); color:#7c7a8e; }
        .step-line { flex:1; height:1px; background:rgba(255,255,255,0.08); max-width:40px; }

        .processing-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:20px; text-align:center; }

        .result-item { border-radius:14px; padding:16px 18px; margin-bottom:10px; }
        .result-ok  { background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.2); }
        .result-err { background:rgba(248,113,113,0.07); border:1px solid rgba(248,113,113,0.2); }
        .result-fname { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; margin-bottom:4px; }
        .result-ok  .result-fname { color:#34d399; }
        .result-err .result-fname { color:#f87171; }
        .type-badge { display:inline-flex; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-left:8px; }
        .json-pre { background:rgba(0,0,0,0.4); border-radius:8px; padding:10px 12px; margin-top:8px; font-family:'Courier New',monospace; font-size:11px; color:#a78bfa; overflow-x:auto; white-space:pre-wrap; max-height:180px; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); }

        .done-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:24px; text-align:center; }
        .done-icon { width:56px; height:56px; border-radius:50%; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); display:flex; align-items:center; justify-content:center; font-size:22px; }
        .reset-btn { padding:10px 28px; border-radius:11px; border:none; background:#7c5cfc; color:#fff; cursor:pointer; font-family:'Syne',sans-serif; font-size:14px; font-weight:700; box-shadow:0 0 20px rgba(124,92,252,0.35); transition:background 0.15s; }
        .reset-btn:hover { background:#9370ff; }
      `}</style>

      {/* Steps */}
      <div className="steps">
        {(["upload","processing","review","done"] as Step[]).map((s, i) => {
          const labels = ["Upload", "Processing", "Review", "Done"];
          const isDone = (
            (s === "upload"     && ["processing","review","done"].includes(step)) ||
            (s === "processing" && ["review","done"].includes(step)) ||
            (s === "review"     && step === "done")
          );
          return (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className={`step-dot ${isDone ? "done" : step === s ? "active" : "idle"}`}>
                {isDone ? "✓" : i + 1}
              </div>
              <span style={{ fontSize:11, color: step === s ? "#f0eeff" : "#7c7a8e", fontFamily:"'DM Sans',sans-serif" }}>
                {labels[i]}
              </span>
              {i < 3 && <div className="step-line" />}
            </div>
          );
        })}
      </div>

      {/* ── UPLOAD ── */}
      {step === "upload" && (
        <div className="up-grid fade-up d1">
          {/* Left config */}
          <div className="up-card">
            <p className="up-card-title">Configuration</p>
            <div className="up-field">
              <label className="up-label">Artist</label>
              <select className="up-select" value={artistId} onChange={e => setArtistId(e.target.value)}>
                <option value="">— select artist —</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="info-box">
              <strong>Auto-detected types</strong>
              {Object.entries(TYPE_LABELS).map(([key, { label, color }]) => (
                <div key={key} className="info-type">
                  <div className="info-dot" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right drop zone */}
          <div className="up-card">
            <p className="up-card-title">Screenshots</p>
            {error && <div className="err-box">⚠ {error}</div>}

            <div
              className={`upload-zone${dragOver ? " over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            >
              <div className="upload-icon">📷</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, color:"#c4c0d8" }}>Drag screenshots here</div>
                <div style={{ fontSize:11, color:"#7c7a8e", marginTop:4 }}>or click to browse · PNG, JPG, WEBP</div>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
              onChange={e => { handleFiles(e.target.files); e.currentTarget.value = ""; }} />

            {files.length > 0 && (
              <div className="file-grid">
                {files.map(f => (
                  <div key={f.id} className="file-item">
                    <img className="file-thumb" src={f.preview} alt={f.name} />
                    <div className="file-name">{f.name}</div>
                    <button className="file-remove" onClick={() => removeFile(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <button className="run-btn" disabled={!artistId || files.length === 0} onClick={runAi}>
              Analyze {files.length > 0 ? `${files.length} screenshot${files.length > 1 ? "s" : ""}` : "Screenshots"} →
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === "processing" && (
        <div className="processing-wrap fade-up">
          <div style={{ width:44, height:44, borderRadius:"50%", border:"1px solid rgba(124,92,252,0.3)", borderTopColor:"#7c5cfc" }} className="spin-slow" />
          <div>
            <div style={{ fontSize:14, color:"#c4c0d8" }}>Analyzing {files.length} screenshot{files.length !== 1 ? "s" : ""}…</div>
            <div style={{ fontSize:11, color:"#7c7a8e", marginTop:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>
              Gemini classifies each screen → extracts data → saves to DB
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === "review" && (
        <div className="fade-up d2">
          <div className="up-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.2em", color:"#7c7a8e", marginBottom:4 }}>Results</p>
                <p className="up-card-title" style={{ marginBottom:0 }}>
                  {successCount}/{results.length} screenshots imported
                </p>
              </div>
              <button className="reset-btn" style={{ padding:"9px 20px", fontSize:13 }} onClick={() => setStep("done")}>
                Confirm →
              </button>
            </div>

            {results.map((r, i) => {
              const typeInfo = r.type ? TYPE_LABELS[r.type] : null;
              return (
                <div key={i} className={`result-item ${r.status === "success" ? "result-ok" : "result-err"}`}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span>{r.status === "success" ? "✓" : "✗"}</span>
                    <p className="result-fname" style={{ margin:0 }}>{r.fileName}</p>
                    {typeInfo && (
                      <span className="type-badge" style={{
                        background: typeInfo.color + "20",
                        color: typeInfo.color,
                        border: `1px solid ${typeInfo.color}40`,
                      }}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                  {r.status === "error" && <p style={{ fontSize:12, color:"#f87171", marginTop:6 }}>{r.error}</p>}
                  {r.status === "success" && r.data && (
                    <pre className="json-pre">{JSON.stringify(r.data, null, 2)}</pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="done-wrap fade-up">
          <div className="done-icon">✓</div>
          <div>
            <p style={{ fontSize:20, fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#f0eeff", marginBottom:6 }}>Import complete</p>
            <p style={{ fontSize:13, color:"#7c7a8e" }}>{successCount} screenshot{successCount !== 1 ? "s" : ""} saved to database.</p>
          </div>
          <button className="reset-btn" onClick={reset}>Upload more screenshots</button>
        </div>
      )}
    </>
  );
}