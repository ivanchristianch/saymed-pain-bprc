"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  uploadUrl: string;
  authToken?: string | null;
  fieldName?: string;
  autoUpload?: boolean;
  withCredentials?: boolean;
  onUploaded?: (result: any) => void;
  onError?: (message: string) => void;
};

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const c of candidates) {
    // @ts-ignore
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

/** ✅ FIXED: Clean token properly */
function normalizeToken(authToken?: string | null): string | null {
  if (!authToken) return null;
  let t = authToken.trim();
  if (!t || t === "null" || t === "undefined") return null;

  // Remove quotes if token stored as JSON string
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  // Remove "Bearer " prefix if already present
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim();
  }

  if (!t) return null;
  return t;
}

function safeFileName(title: string, ext: string) {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "audio";
  return `${base}.${ext}`;
}

export default function AudioRecorder({
  title,
  uploadUrl,
  authToken,
  fieldName = "audio",
  autoUpload = true,
  withCredentials = false,
  onUploaded,
  onError,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [durationSec, setDurationSec] = useState<number>(0);
  const [origin, setOrigin] = useState<string>("");

  const mimeType = useMemo(() => pickMimeType(), []);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string>("");

  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const token = useMemo(() => normalizeToken(authToken), [authToken]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (timerRef.current) window.clearInterval(timerRef.current);
      } catch { }
      timerRef.current = null;

      try {
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      } catch { }

      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
      } catch { }
      streamRef.current = null;
    };
  }, []);

  async function start() {
    setStatus("");
    onError?.("");

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    } catch { }
    setAudioUrl("");
    chunksRef.current = [];
    setDurationSec(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstart = () => {
        setRecording(true);
        setStatus("Recording (percakapan dua arah)...");
        timerRef.current = window.setInterval(() => setDurationSec((s) => s + 1), 1000) as any;
      };

      rec.onerror = () => {
        const msg = "Recorder error.";
        setStatus(msg);
        onError?.(msg);
      };

      rec.onstop = async () => {
        setRecording(false);

        try {
          if (timerRef.current) window.clearInterval(timerRef.current);
        } catch { }
        timerRef.current = null;

        try {
          streamRef.current?.getTracks?.().forEach((t) => t.stop());
        } catch { }
        streamRef.current = null;

        setStatus("Preparing audio...");

        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });

        try {
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        } catch { }

        if (!autoUpload) {
          setStatus("Ready (autoUpload=false).");
          return;
        }

        if (!uploadUrl) {
          const msg = "Upload URL empty (encounter id belum ada).";
          setStatus(msg);
          onError?.(msg);
          return;
        }

        // ✅ UPLOAD WITH PROPER HEADERS
        try {
          setStatus("Uploading audio...");

          const form = new FormData();
          const ext = (mimeType || "audio/webm").includes("ogg") ? "ogg" : "webm";
          form.append(fieldName, blob, safeFileName(title, ext));

          // ✅ FIXED: Proper Authorization header
          const headers: Record<string, string> = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          console.log("🔐 Upload attempt:", {
            url: uploadUrl,
            hasToken: !!token,
            tokenPreview: token ? `${token.slice(0, 15)}...` : "null",
            headers: headers,
          });

          console.log("🚀 STARTING UPLOAD 🚀");
          console.log("👉 URL:", uploadUrl);
          console.log("👉 Token len:", token ? token.length : 0);

          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: Object.keys(headers).length ? headers : undefined,
            body: form,
            credentials: withCredentials ? "include" : "same-origin",
          });

          if (!res.ok) {
            let errorDetail = "";
            try {
              const errorData = await res.json();
              errorDetail = errorData.detail || JSON.stringify(errorData);
            } catch {
              errorDetail = await res.text().catch(() => "");
            }

            const msg =
              res.status === 401
                ? `❌ Upload failed (401 Unauthorized). Token invalid/expired. Detail: ${errorDetail}`
                : res.status === 403
                  ? `❌ Upload failed (403 Forbidden). Role/permission tidak sesuai. Detail: ${errorDetail}`
                  : `❌ Upload failed (${res.status}). Detail: ${errorDetail}`;

            console.error("Upload error:", msg);
            setStatus(msg);
            onError?.(msg);
            return;
          }

          const json = await res.json().catch(() => ({}));
          console.log("✅ Upload success", json);
          setStatus("✅ Uploaded successfully!");
          onUploaded?.(json);
        } catch (e: any) {
          const msg = `❌ Upload failed (network/backend error). ${e?.message || ""}`.trim();
          console.error("Upload exception:", e);
          setStatus(msg);
          onError?.(msg);
        }
      };

      rec.start(1000);
    } catch (e: any) {
      const msg = "Mic permission denied / mic tidak tersedia.";
      setStatus(msg);
      onError?.(msg);
    }
  }

  function stop() {
    try {
      mediaRecRef.current?.stop();
    } catch { }
  }

  const tokenPreview = token ? `${token.slice(0, 10)}...` : "❌ NO TOKEN";
  const tokenLooksValid = token && token.length > 20 && !token.includes("Bearer Bearer");

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>
        Voice: {title}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className={`btn ${recording ? "" : "btnPrimary"}`} onClick={recording ? stop : start}>
          {recording ? "Stop Recording" : "Start Recording"}
        </button>

        <span className="p" style={{ opacity: 0.9 }}>
          {recording ? `Recording... ${durationSec}s` : status || "Rekam percakapan perawat/dokter dengan pasien. (save audio)"}
        </span>
      </div>



      {audioUrl ? (
        <div style={{ marginTop: 10 }}>
          <div className="p" style={{ opacity: 0.9, marginBottom: 6 }}>
            Preview:
          </div>
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        </div>
      ) : null}


    </div>
  );
}