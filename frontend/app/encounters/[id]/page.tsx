"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import NursingFormBPRC, { NursingBPRCData } from "./NursingFormBPRC";
import DoctorFormBPRC, { DoctorBPRCData } from "./DoctorFormBPRC";
import TherapyForm, { TherapyData } from "./TherapyForm";
import DischargeSummaryForm, { DischargeSummaryData } from "./DischargeSummaryForm";
import CorrespondenceForm, { CorrespondenceData } from "./CorrespondenceForm";
import AudioRecorder from "./AudioRecorder";
import { transformNursing, transformMedical, transformExam, restoreNursing, restoreDoctor } from "./transformers";

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

  const [tab, setTab] = useState<"demographic" | "medical_history" | "present_illness" | "examination" | "therapy" | "discharge_summary" | "correspondence" | "administrative">("demographic");

  // Voice prefill
  const [nursingPrefill, setNursingPrefill] = useState<any>(null);
  const [doctorPrefill, setDoctorPrefill] = useState<any>(null);

  // Review modal state
  const [reviewData, setReviewData] = useState<any>(null);

  // Database initial data (restored)
  const [nursingInit, setNursingInit] = useState<any>(null);
  const [doctorInit, setDoctorInit] = useState<any>(null);
  const [therapyInit, setTherapyInit] = useState<any>(null);
  const [dischargeInit, setDischargeInit] = useState<any>(null);
  const [corrInit, setCorrInit] = useState<any[]>([]);

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

        // Restore data
        const nData = restoreNursing(data);
        if (nData) setNursingInit(nData);

        const dData = restoreDoctor(data);
        if (dData) setDoctorInit(dData);

        if (data.therapy) setTherapyInit(data.therapy);
        if (data.discharge_summary) setDischargeInit(data.discharge_summary);
        if (data.correspondences) setCorrInit(data.correspondences);

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

  const nursingUploadUrl =
    id ? `${API}/api/encounters/${id}/voice/upload?role=nurse&section=interview` : "";
  const doctorUploadUrl =
    id ? `${API}/api/encounters/${id}/voice/upload?role=doctor&section=interview` : "";

  // save Nursing
  async function handleSaveNursing(data: NursingBPRCData) {
    try {
      setStatus("Saving Nursing data...");
      const payload = transformNursing(data);

      const res = await fetch(`${API}/api/encounters/${id}/nursing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save nursing data");

      setStatus("Nursing data saved!");
      setTimeout(() => setStatus(""), 2000);
      alert("Nursing data saved successfully.");
    } catch (err) {
      console.error(err);
      setStatus("Error saving nursing data.");
      alert("Error saving nursing data.");
    }
  }

  // save Doctor
  async function handleSaveDoctor(data: DoctorBPRCData) {
    try {
      setStatus("Saving Doctor data...");

      // 1. Save Medical Assessment
      const medicalPayload = transformMedical(data);
      const resMed = await fetch(`${API}/api/encounters/${id}/medical`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(medicalPayload),
      });
      if (!resMed.ok) {
        const errText = await resMed.text();
        throw new Error(`Failed to save medical data: ${errText}`);
      }

      // 2. Save Physical Exam
      const examPayload = transformExam(data);
      const resExam = await fetch(`${API}/api/encounters/${id}/exam`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(examPayload),
      });
      if (!resExam.ok) {
        const errText = await resExam.text();
        throw new Error(`Failed to save exam data: ${errText}`);
      }

      setStatus("Doctor data saved!");
      setTimeout(() => setStatus(""), 2000);
      alert("Doctor data saved successfully.");
    } catch (err: any) {
      console.error(err);
      setStatus("Error saving doctor data.");
      alert(`Error saving doctor data: ${err.message}`);
    }
  }

  async function handleSaveTherapy(data: TherapyData) {
    try {
      setStatus("Saving Therapy data...");
      const res = await fetch(`${API}/api/encounters/${id}/therapy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save therapy");
      setStatus("Therapy saved!");
      setTimeout(() => setStatus(""), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSaveDischarge(data: DischargeSummaryData) {
    try {
      setStatus("Saving Discharge Summary...");
      const res = await fetch(`${API}/api/encounters/${id}/discharge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save discharge summary");
      setStatus("Discharge Summary saved!");
      setTimeout(() => setStatus(""), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSaveCorrespondenceField(data: CorrespondenceData) {
    try {
      setStatus("Saving Correspondence...");
      const res = await fetch(`${API}/api/encounters/${id}/correspondence`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save correspondence");

      const savedDoc = await res.json();
      setCorrInit(prev => [...prev, savedDoc]); // Append to list locally

      setStatus("Correspondence saved!");
      setTimeout(() => setStatus(""), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <>
      {/* Global Recording Bar (always mounted) */}
      <div className="card" style={{ marginBottom: 24, borderColor: "var(--primary)", background: "rgba(13, 148, 136, 0.02)" }}>
        <h2 className="h2" style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)" }}></div>
          Global Voice Recorder
        </h2>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <AudioRecorder
            title="Nursing Interview"
            uploadUrl={nursingUploadUrl}
            authToken={token}
            onUploaded={(result) => {
              if (result.structured) setReviewData({ ...result, role: "nurse" });
            }}
          />
          <AudioRecorder
            title="Doctor Interview"
            uploadUrl={doctorUploadUrl}
            authToken={token}
            onUploaded={(result) => {
              if (result.structured) setReviewData({ ...result, role: "doctor" });
            }}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 className="h1">Patient Encounter</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => exportPdf("id")}>Export PDF</button>
          </div>
        </div>

        {status && <p className="p" style={{ marginBottom: 16, color: "var(--primary)", fontWeight: 500 }}>{status}</p>}

        {/* Tab Navigation */}
        <div className="tabs-container">
          {[
            { id: "demographic", label: "Demographic Data" },
            { id: "medical_history", label: "Medical History" },
            { id: "present_illness", label: "Present Illness" },
            { id: "examination", label: "Examination Result" },
            { id: "therapy", label: "Therapy" },
            { id: "discharge_summary", label: "Discharge Summary" },
            { id: "correspondence", label: "Correspondence" },
            { id: "administrative", label: "Administrative & Billing" }
          ].map((t) => (
            <button
              key={t.id}
              className={`tab-button ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id as any)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "8px 0" }}>
          <div style={{ display: tab === "demographic" ? "block" : "none" }}>
            <div>
              <h2 className="h2">Demographic Data</h2>
              <p className="p" style={{ marginBottom: 24 }}>Verify patient identity below.</p>
              <div className="grid">
                <div className="form-group"><label className="form-label">Full Name</label><input className="input" disabled value={enc?.patient?.full_name || "-"} /></div>
                <div className="form-group"><label className="form-label">Date of Birth / Age</label><input className="input" disabled value={(enc?.patient?.age_years ? enc.patient.age_years + " years" : "") || "-"} /></div>
                <div className="form-group"><label className="form-label">Gender</label><input className="input" disabled value={enc?.patient?.sex || "Not Specified"} /></div>
                <div className="form-group"><label className="form-label">Medical Record Number (RM)</label><input className="input" disabled value={enc?.patient?.rm_number || "-"} /></div>
                <div className="form-group"><label className="form-label">Blood Group</label><input className="input" disabled value={enc?.patient?.blood_group || "-"} /></div>
                <div className="form-group"><label className="form-label">Marital Status</label><input className="input" disabled value={enc?.patient?.marital_status || "-"} /></div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}><label className="form-label">Address</label><input className="input" disabled value={enc?.patient?.address || "-"} /></div>
              </div>
            </div>
          </div>

          <div style={{ display: tab === "medical_history" ? "block" : "none" }}>
            <div>
              <h2 className="h2">Medical History</h2>
              <p className="p" style={{ marginBottom: 24 }}>Patient's past medical events.</p>
              <div className="grid">
                <div className="form-group"><label className="form-label">Past Medical History</label><textarea className="textarea" rows={3}></textarea></div>
                <div className="form-group"><label className="form-label">Past Surgeries</label><textarea className="textarea" rows={3}></textarea></div>
                <div className="form-group"><label className="form-label">Chronic Medications</label><textarea className="textarea" rows={3}></textarea></div>
                <div className="form-group"><label className="form-label">Allergies</label><textarea className="textarea" rows={3}></textarea></div>
              </div>
            </div>
          </div>

          <div style={{ display: tab === "present_illness" ? "block" : "none" }}>
            <div style={{ display: "grid", gap: 40 }}>
              <div>
                <h2 className="h2" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 24 }}>
                  Nursing Assessment
                </h2>
                <NursingFormBPRC
                  encounterId={id || ""}
                  prefill={nursingPrefill}
                  initialData={nursingInit}
                  onSave={handleSaveNursing}
                />
              </div>

              <div>
                <h2 className="h2" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 24 }}>
                  Medical Assessment
                </h2>
                <DoctorFormBPRC
                  encounterId={id || ""}
                  prefill={doctorPrefill}
                  initialData={doctorInit}
                  audioFilename={enc?.audio_doctor}
                  onSave={handleSaveDoctor}
                />
              </div>
            </div>
          </div>

          <div style={{ display: tab === "examination" ? "block" : "none" }}>
            <div>
              <h2 className="h2">Examination Result</h2>
              <p className="p">External PDF uploads and structured lab views will appear here.</p>
              <div style={{ marginTop: 24, padding: 32, textAlign: "center", border: "2px dashed var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                <p className="p">Drag and drop PDF reports here</p>
                <button className="btn" style={{ marginTop: 12 }}>Upload File</button>
              </div>
            </div>
          </div>

          <div style={{ display: tab === "therapy" ? "block" : "none" }}>
            <div>
              <h2 className="h2" style={{ marginBottom: 24 }}>Therapy</h2>
              <TherapyForm encounterId={id || ""} role={role} initialData={therapyInit} onSave={handleSaveTherapy} />
            </div>
          </div>

          <div style={{ display: tab === "discharge_summary" ? "block" : "none" }}>
            <div>
              <h2 className="h2" style={{ marginBottom: 24 }}>Discharge Summary</h2>
              <DischargeSummaryForm encounterId={id || ""} role={role} initialData={dischargeInit} onSave={handleSaveDischarge} />
            </div>
          </div>

          <div style={{ display: tab === "correspondence" ? "block" : "none" }}>
            <div>
              <h2 className="h2" style={{ marginBottom: 24 }}>Correspondence (Draft & History)</h2>
              <CorrespondenceForm encounterId={id || ""} role={role} initialData={corrInit} onSaveNew={handleSaveCorrespondenceField} />
            </div>
          </div>

          <div style={{ display: tab === "administrative" ? "block" : "none" }}>
            <div>
              <h2 className="h2">Administrative & Billing</h2>
              <p className="p">Insurance information and billing codes.</p>
              <div className="grid" style={{ marginTop: 24 }}>
                <div className="form-group"><label className="form-label">Insurance Provider</label><input className="input" placeholder="e.g. BPJS" /></div>
                <div className="form-group"><label className="form-label">Billing Code</label><input className="input" placeholder="ICD-10" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Review Modal */}
      {reviewData && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.6)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 1000, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: 16, marginBottom: 16 }}>
              <h2 className="h1" style={{ margin: 0 }}>AI Review Panel</h2>
              <button className="btn" style={{ padding: "4px 12px" }} onClick={() => setReviewData(null)}>✕</button>
            </div>

            <div className="grid" style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <h3 className="h2" style={{ fontSize: 16, color: "var(--text)" }}>Raw Transcript</h3>
                <div style={{ flex: 1, padding: 16, background: "var(--bg)", borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 14, overflowY: "auto", border: "1px solid var(--line)" }}>
                  {reviewData.transcript || "No transcript available."}
                  {reviewData.transcript === "(API Key missing)" && (
                    <div style={{ color: "var(--danger)", marginTop: 10, fontWeight: 600 }}>
                      Warning: OpenAI API key might be missing on the server. The audio was recorded but transcription failed.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <h3 className="h2" style={{ fontSize: 16, color: "var(--text)" }}>Structured Data</h3>
                <pre style={{ flex: 1, padding: 16, background: "var(--bg)", borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 13, overflowY: "auto", margin: 0, border: "1px solid var(--line)" }}>
                  {JSON.stringify(reviewData.structured, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 16 }}>
              <button className="btn btnDanger" onClick={() => setReviewData(null)}>Discard</button>
              <button className="btn btnPrimary" onClick={() => {
                if (reviewData.role === "nurse") {
                  setNursingPrefill(reviewData.structured);
                  setTab("present_illness");
                } else {
                  setDoctorPrefill(reviewData.structured);
                  setTab("present_illness");
                }
                setReviewData(null);
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }}>Apply to Chart</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
