"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type UploadStep = "idle" | "processing" | "done" | "error";

type ScreenshotType =
  | "overview_totals"
  | "overview_chart"
  | "location_countries"
  | "location_cities"
  | "playlists";

type DailyMetricKey = "streams" | "listeners" | "saves" | "playlist_adds";

interface Track { id: number; title: string; image_url?: string; }

interface ScreenshotSlot {
  id:          string;
  type:        ScreenshotType;
  metricKey?:  DailyMetricKey;   // only for overview_chart
  file:        File | null;
  preview:     string | null;
}

interface ProcessedResult {
  fileName: string;
  status:   "success" | "error";
  type:     ScreenshotType;
  data?:    any;
  saved?:   any;
  error?:   string;
}

/* ─── Config ─────────────────────────────────────────────────────────────────── */

const SCREENSHOT_TYPES: {
  type:        ScreenshotType;
  label:       string;
  description: string;
  color:       string;
  emoji:       string;
  needsMetric: boolean;
  needsRange:  boolean;
}[] = [
  {
    type:        "overview_totals",
    label:       "Overview — Totals",
    description: "Streams, Listeners, Saves, Playlist Adds (aggregated KPIs)",
    color:       "#a78bfa",
    emoji:       "📊",
    needsMetric: false,
    needsRange:  false,
  },
  {
    type:        "overview_chart",
    label:       "Overview — Daily Chart",
    description: "Streams or Listeners daily trend chart",
    color:       "#34d399",
    emoji:       "📈",
    needsMetric: true,
    needsRange:  true,
  },
  {
    type:        "location_countries",
    label:       "Location — Countries",
    description: "Top countries ranking table",
    color:       "#38bdf8",
    emoji:       "🌍",
    needsMetric: false,
    needsRange:  false,
  },
  {
    type:        "location_cities",
    label:       "Location — Cities",
    description: "Top cities ranking table",
    color:       "#f472b6",
    emoji:       "📍",
    needsMetric: false,
    needsRange:  false,
  },
  {
    type:        "playlists",
    label:       "Playlists",
    description: "Playlist appearances with stream counts",
    color:       "#fb923c",
    emoji:       "🎵",
    needsMetric: false,
    needsRange:  false,
  },
];

const DAILY_METRICS: { key: DailyMetricKey; label: string; color: string }[] = [
  { key: "streams",       label: "Streams",       color: "#34d399" },
  { key: "listeners",     label: "Listeners",     color: "#a78bfa" },
  { key: "saves",         label: "Saves",         color: "#f472b6" },
  { key: "playlist_adds", label: "Playlist Adds", color: "#38bdf8" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res((r.result as string).split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("it-IT");
}

/* ─── SlotCard ───────────────────────────────────────────────────────────────── */

function SlotCard({
  slot,
  periodStart,
  periodEnd,
  onFileChange,
  onMetricChange,
  onRemove,
}: {
  slot:           ScreenshotSlot;
  periodStart:    string;
  periodEnd:      string;
  onFileChange:   (id: string, file: File | null) => void;
  onMetricChange: (id: string, key: DailyMetricKey) => void;
  onRemove:       (id: string) => void;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const meta = SCREENSHOT_TYPES.find(t => t.type === slot.type)!;

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    onFileChange(slot.id, f);
  }, [slot.id, onFileChange]);

  const dayCount = periodStart && periodEnd
    ? Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) + 1
    : 0;

  return (
    <div style={{
      borderRadius: 16, border: `1.5px solid ${slot.file ? meta.color + "44" : "rgba(255,255,255,0.07)"}`,
      background: "rgba(13,13,22,0.6)", overflow: "hidden",
      transition: "border-color 0.2s",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px",
        background: `linear-gradient(90deg, ${meta.color}0a 0%, transparent 100%)`,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize: 18 }}>{meta.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, fontFamily: "'Syne',sans-serif" }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 11, color: "#7c7a8e", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
            {meta.description}
          </div>
        </div>
        <button
          onClick={() => onRemove(slot.id)}
          style={{
            width: 24, height: 24, borderRadius: 7, border: "none",
            background: "rgba(248,113,113,0.1)", color: "#f87171",
            cursor: "pointer", fontSize: 12, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >✕</button>
      </div>

      {/* Metric picker for overview_chart */}
      {meta.needsMetric && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#7c7a8e", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
            Metric in this chart
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DAILY_METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => onMetricChange(slot.id, m.key)}
                style={{
                  padding: "4px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                  fontFamily: "'Syne',sans-serif", cursor: "pointer",
                  border: `1px solid ${slot.metricKey === m.key ? m.color + "66" : "rgba(255,255,255,0.07)"}`,
                  background: slot.metricKey === m.key ? m.color + "18" : "transparent",
                  color: slot.metricKey === m.key ? m.color : "#7c7a8e",
                  transition: "all 0.15s",
                }}
              >{m.label}</button>
            ))}
          </div>
          {meta.needsRange && periodStart && periodEnd && (
            <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 8, fontFamily: "'DM Sans',sans-serif" }}>
              Range: {periodStart} → {periodEnd} ({dayCount} giorni)
            </div>
          )}
          {meta.needsRange && (!periodStart || !periodEnd) && (
            <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 8, fontFamily: "'DM Sans',sans-serif" }}>
              ⚠ Set the date range above before uploading
            </div>
          )}
        </div>
      )}

      {/* Drop zone / preview */}
      <div style={{ padding: 14 }}>
        {slot.file && slot.preview ? (
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
            <img
              src={slot.preview}
              alt="preview"
              style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block", background: "#0d0d16" }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "4px 8px",
              background: "linear-gradient(transparent, rgba(5,5,10,0.9))",
            }}>
              <span style={{ fontSize: 10, color: "#c4c0d8", fontFamily: "'DM Sans',sans-serif" }}>
                {slot.file.name}
              </span>
            </div>
            <button
              onClick={() => onFileChange(slot.id, null)}
              style={{
                position: "absolute", top: 6, right: 6,
                width: 24, height: 24, borderRadius: 6, border: "none",
                background: "rgba(13,13,22,0.9)", color: "#f87171",
                cursor: "pointer", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => {
              e.preventDefault(); setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            style={{
              border: `2px dashed ${drag ? meta.color + "88" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10, padding: "24px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              background: drag ? meta.color + "0a" : "rgba(255,255,255,0.01)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 22 }}>📷</span>
            <span style={{ fontSize: 11, color: "#7c7a8e", fontFamily: "'DM Sans',sans-serif", textAlign: "center" }}>
              Drop screenshot or click
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ─── ResultCard ─────────────────────────────────────────────────────────────── */

function ResultCard({ result }: { result: ProcessedResult }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SCREENSHOT_TYPES.find(t => t.type === result.type);
  const isOk = result.status === "success";

  return (
    <div style={{
      borderRadius: 14, padding: "14px 16px", marginBottom: 10,
      background: isOk ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
      border: `1px solid ${isOk ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{isOk ? "✅" : "❌"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: isOk ? "#34d399" : "#f87171",
            fontFamily: "'Syne',sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {result.fileName}
          </div>
          {meta && (
            <div style={{ fontSize: 11, color: meta.color, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
              {meta.emoji} {meta.label}
            </div>
          )}
        </div>
        {isOk && result.data && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: "#7c7a8e", fontSize: 11,
              fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
            }}
          >
            {expanded ? "Hide" : "Show"} data
          </button>
        )}
      </div>

      {!isOk && result.error && (
        <div style={{ fontSize: 12, color: "#f87171", marginTop: 8, fontFamily: "'DM Sans',sans-serif" }}>
          {result.error}
        </div>
      )}

      {isOk && expanded && result.data && (
        <pre style={{
          marginTop: 10,
          background: "rgba(0,0,0,0.4)", borderRadius: 8,
          padding: "10px 12px", fontFamily: "'Courier New',monospace",
          fontSize: 10, color: "#a78bfa", overflow: "auto",
          maxHeight: 200, whiteSpace: "pre-wrap",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ─── UploadTracksTab ────────────────────────────────────────────────────────── */

interface Props {
  artists: { id: string; name: string }[];
}

export default function UploadTracksTab({ artists }: Props) {
  const [artistId,     setArtistId]     = useState("");
  const [trackId,      setTrackId]      = useState<number | "">("");
  const [tracks,       setTracks]       = useState<Track[]>([]);
  const [slots,        setSlots]        = useState<ScreenshotSlot[]>([]);
  const [periodStart,  setPeriodStart]  = useState("");
  const [periodEnd,    setPeriodEnd]    = useState("");
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().slice(0, 10));
  const [step,         setStep]         = useState<UploadStep>("idle");
  const [results,      setResults]      = useState<ProcessedResult[]>([]);
  const [errorMsg,     setErrorMsg]     = useState("");

  // Load tracks when artist changes
  useEffect(() => {
    if (!artistId) { setTracks([]); setTrackId(""); return; }
    supabase
      .from("tracks")
      .select("id, title, image_url")
      .eq("artist_id", artistId)
      .order("title")
      .then(({ data }) => setTracks(data ?? []));
    setTrackId("");
  }, [artistId]);

  const addSlot = (type: ScreenshotType) => {
    setSlots(prev => [...prev, {
      id:        crypto.randomUUID(),
      type,
      metricKey: type === "overview_chart" ? "streams" : undefined,
      file:      null,
      preview:   null,
    }]);
  };

  const updateSlotFile = useCallback((id: string, file: File | null) => {
    setSlots(prev => prev.map(s => s.id !== id ? s : {
      ...s,
      file,
      preview: file ? URL.createObjectURL(file) : null,
    }));
  }, []);

  const updateSlotMetric = useCallback((id: string, key: DailyMetricKey) => {
    setSlots(prev => prev.map(s => s.id !== id ? s : { ...s, metricKey: key }));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  const filledSlots  = slots.filter(s => s.file !== null);
  const canProcess   = !!artistId && !!trackId && filledSlots.length > 0 && step !== "processing";

  const handleProcess = async () => {
    if (!canProcess) return;
    setStep("processing"); setErrorMsg(""); setResults([]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessione scaduta. Effettua il login.");

      const files = await Promise.all(
        filledSlots.map(async (s) => ({
          name:         s.file!.name,
          type:         s.type,
          metric_key:   s.metricKey,
          period_start: s.type === "overview_chart" ? periodStart || undefined : undefined,
          period_end:   s.type === "overview_chart" ? periodEnd   || undefined : undefined,
          base64:       await fileToBase64(s.file!),
          mimeType:     s.file!.type || "image/jpeg",
        }))
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/smooth-function`,
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey":        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            artist_id:     artistId,
            track_id:      trackId,
            snapshot_date: snapshotDate,
            files,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Edge function error: ${res.status}`);
      setResults(json.results ?? []);
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Errore imprevisto");
      setStep("error");
    }
  };

  const reset = () => {
    setSlots([]); setResults([]); setStep("idle"); setErrorMsg("");
  };

  const successCount = results.filter(r => r.status === "success").length;
  const selectedTrack = tracks.find(t => t.id === trackId);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (step === "done") return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 24, padding: "48px 32px", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(52,211,153,0.12)", border: "1.5px solid rgba(52,211,153,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>✓</div>
      <div>
        <p style={{ fontSize: 20, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#f0eeff", margin: 0 }}>
          {successCount}/{results.length} processed screenshots 
        </p>
        {selectedTrack && (
          <p style={{ fontSize: 13, color: "#7c7a8e", margin: "8px 0 0", fontFamily: "'DM Sans',sans-serif" }}>
            Track: <span style={{ color: "#a78bfa" }}>{selectedTrack.title}</span>
          </p>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 560, textAlign: "left" }}>
        {results.map((r, i) => <ResultCard key={i} result={r} />)}
      </div>

      <button
        onClick={reset}
        className="run-btn"
        style={{ width: "auto", padding: "11px 32px" }}
      >
        Upload more screenshots
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Config card ── */}
      <div className="up-card">
        <p className="up-card-title">Config</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>

          {/* Artist */}
          <div className="up-field">
            <label className="up-label">Artist</label>
            <select
              className="up-select"
              value={artistId}
              onChange={e => setArtistId(e.target.value)}
            >
              <option value="">— select artist —</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Track */}
          <div className="up-field">
            <label className="up-label">Track</label>
            <select
              className="up-select"
              value={trackId}
              onChange={e => setTrackId(Number(e.target.value) || "")}
              disabled={!artistId || tracks.length === 0}
            >
              <option value="">— select track —</option>
              {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          {/* Snapshot date */}
          <div className="up-field">
            <label className="up-label">Snapshot Date</label>
            <input
              type="date"
              value={snapshotDate}
              onChange={e => setSnapshotDate(e.target.value)}
              className="up-select"
              style={{ cursor: "pointer", colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Chart date range (shown always, relevant for overview_chart slots) */}
        {slots.some(s => s.type === "overview_chart") && (
          <div className="up-field" style={{ marginBottom: 0 }}>
            <label className="up-label">Daily chart range</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="up-select"
                style={{ cursor: "pointer", colorScheme: "dark", flex: 1 }}
              />
              <span style={{ color: "#7c7a8e" }}>→</span>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="up-select"
                style={{ cursor: "pointer", colorScheme: "dark", flex: 1 }}
              />
            </div>
            {periodStart && periodEnd && (
              <span style={{ fontSize: 11, color: "#a78bfa", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>
                {Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) + 1} giorni · {periodStart} → {periodEnd}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Add screenshot type buttons ── */}
      <div className="up-card">
        <p className="up-card-title">Add Screenshot</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
          {SCREENSHOT_TYPES.map(meta => (
            <button
              key={meta.type}
              onClick={() => addSlot(meta.type)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 11, cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
                border: "1.5px dashed rgba(255,255,255,0.08)",
                transition: "all 0.15s", textAlign: "left",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = meta.color + "66";
                (e.currentTarget as HTMLButtonElement).style.background = meta.color + "0a";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, fontFamily: "'Syne',sans-serif" }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: 10, color: "#7c7a8e", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
                  + add
                </div>
              </div>
            </button>
          ))}
        </div>

        {slots.length === 0 && (
          <p style={{
            textAlign: "center", color: "#7c7a8e", fontSize: 13,
            fontFamily: "'DM Sans',sans-serif", marginTop: 20, marginBottom: 4,
          }}>
            Click a type above to add a screenshot slot ↑
          </p>
        )}
      </div>

      {/* ── Slot cards ── */}
      {slots.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
          {slots.map(slot => (
            <SlotCard
              key={slot.id}
              slot={slot}
              periodStart={periodStart}
              periodEnd={periodEnd}
              onFileChange={updateSlotFile}
              onMetricChange={updateSlotMetric}
              onRemove={removeSlot}
            />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {step === "error" && (
        <div className="err-box">
          ⚠ {errorMsg}
          <button
            onClick={() => setStep("idle")}
            style={{
              marginLeft: 12, background: "none",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: 6, color: "#f87171",
              fontSize: 11, padding: "2px 10px", cursor: "pointer",
            }}
          >Retry</button>
        </div>
      )}

      {/* ── Process button ── */}
      {slots.length > 0 && (
        <button
          className="run-btn"
          disabled={!canProcess}
          onClick={handleProcess}
        >
          {step === "processing" ? (
            <>
              <span style={{
                display: "inline-block", width: 16, height: 16,
                border: "2px solid rgba(255,255,255,0.2)",
                borderTop: "2px solid #fff", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Processing {filledSlots.length} screenshot…
            </>
          ) : (
            <>
              Analyze {filledSlots.length > 0 ? filledSlots.length : slots.length} screenshot{filledSlots.length !== 1 ? "s" : ""} →
            </>
          )}
        </button>
      )}

    </div>
  );
}