"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import NursingFormBPRC, { NursingBPRCData } from "./NursingFormBPRC";
import DoctorFormBPRC, { DoctorBPRCData } from "./DoctorFormBPRC";
import AudioRecorder from "./AudioRecorder";

const API = process.env.NEXT_PUBLIC_API_BASE;

function authHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EncounterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [enc, setEnc] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [role, setRole] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const [tab, setTab] = useState<"workspace" | "nursing" | "doctor">("workspace");

  const [nursingPrefill, setNursingPrefill] = useState<any>(null);
  const [doctorPrefill, setDoctorPrefill] = useState<any>(null);

  // role + token (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role") || "-");
      setToken(localStorage.getItem("access_token"));
    }
  }, []);

  // load encounter
  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setStatus("Loading encounter...");
        const res = await fetch(`${API}/api/encounters/${id}`, {
          headers: authHeaders(),
        });

        if (!res.ok) {
          setStatus("Failed. Please login.");
          return;
        }

        const data = await res.json();
        setEnc(data);
        setStatus("");
      } catch (err) {
        setStatus("Failed to load encounter.");
      }
    }

    load();
  }, [id]);

  // export PDF
  async function exportPdf(lang: "id" | "en") {
    try {
      setStatus("Generating PDF...");
      const res = await fetch(`${API}/api/encounters/${id}/pdf?lang=${lang}`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (!res.ok) {
        setStatus("Failed to generate PDF.");
        return;
      }

      const data = await res.json();

      // backend kirim HEX string (meski namanya bytes_b64)
      const hex = data.bytes_b64 as string;
      const bytes = new Uint8Array(
        (hex.match(/.{1,2}/g) || []).map((b: string) => parseInt(b, 16))
      );

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setStatus("");
    } catch (err) {
      setStatus("Failed to generate PDF.");
    }
  }

  // NOTE:
  // AudioRecorder Anda mengirim POST ke uploadUrl.
  // Backend Anda butuh:
  //   POST /api/encounters/{id}/voice/upload?role=doctor|nurse&section=interview
  //   form-data field: audio
  //
  // Pastikan AudioRecorder mengirim field "audio" (bukan "file" / "blob").
  // Kalau AudioRecorder Anda bisa set nama field, pakai "audio".
  // Kalau tidak bisa, bilang saya—saya sesuaikan AudioRecorder-nya.

  const nursingUploadUrl =
    id ? `${API}/api/encounters/${id}/voice/upload?role=nurse&section=interview` : "";
  const doctorUploadUrl =
    id ? `${API}/api/encounters/${id}/voice/upload?role=doctor&section=interview` : "";

  return (
    <div className="card">
      <h1 className="h1">Encounter Workspace</h1>



      <div className="row" style={{ marginTop: 14, flexWrap: "wrap", gap: 10 }}>
        <button className="btn" onClick={() => setTab("nursing")}>
          Nursing
        </button>
        <button className="btn" onClick={() => setTab("doctor")}>
          Doctor
        </button>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btnPrimary" onClick={() => exportPdf("id")}>
          Export PDF (ID)
        </button>

        <button className="btn" onClick={() => exportPdf("en")}>
          Export PDF (EN)
        </button>
      </div>



      <p className="p" style={{ marginTop: 10 }}>
        {status}
      </p>

      {/* =========================
          VOICE RECORDING (2 tombol)
          ========================= */}
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <AudioRecorder
          title="Nursing Interview (Percakapan Perawat–Pasien)"
          uploadUrl={nursingUploadUrl}
          authToken={token}
          onUploaded={(result) => {
            console.log("Nursing audio uploaded result:", result);
            if (result.structured) {
              setNursingPrefill(result.structured);
              setTab("nursing"); // Auto switch tab
            }
            alert("Nursing audio uploaded! Form auto-filled.");
          }}
        />

        <AudioRecorder
          title="Doctor Interview (Percakapan Dokter–Pasien)"
          uploadUrl={doctorUploadUrl}
          authToken={token}
          onUploaded={(result) => {
            console.log("Doctor audio uploaded result:", result);
            if (result.structured) {
              setDoctorPrefill(result.structured);
              setTab("doctor"); // Auto switch tab
            }
            alert(`Doctor audio uploaded with data:\n${JSON.stringify(result.structured, null, 2)}`);
          }}
        />
      </div>

      {/* =========================
          CONTENT TABS
          ========================= */}
      {tab === "workspace" && (
        <div className="p" style={{ marginTop: 14, opacity: 0.5 }}>
          Select a form (Nursing / Doctor) or use Voice Recording above.
        </div>
      )}

      {tab === "nursing" && (
        <NursingFormBPRC
          encounterId={id || ""}
          prefill={nursingPrefill}
          onSave={async (payload: NursingBPRCData) => {
            console.log("Nursing BPRC payload:", payload);
            alert("Saved (dummy). Lihat payload di Console.");
          }}
        />
      )}

      {tab === "doctor" && (
        <DoctorFormBPRC
          encounterId={id || ""}
          prefill={doctorPrefill}
          onSave={async (payload: DoctorBPRCData) => {
            console.log("Doctor BPRC payload:", payload);
            alert("Saved (dummy). Lihat payload di Console.");
          }}
        />
      )}
    </div>
  );
}
