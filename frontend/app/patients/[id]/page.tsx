"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [patient, setPatient] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  async function load() {
    try {
      setStatus("Loading...");
      const pr = await fetch(`${API}/api/patients/${id}`, { headers: authHeaders() });
      if (!pr.ok) { setStatus("Failed. Please login."); return; }
      const p = await pr.json();
      setPatient(p);
      setFormData(p);

      const er = await fetch(`${API}/api/encounters?patient_id=${id}`, { headers: authHeaders() });
      setEncounters(er.ok ? await er.json() : []);
      setStatus("");
    } catch (err: any) {
      console.error(err);
      setStatus(`Error loading page: ${err.message}`);
    }
  }

  async function savePatient() {
    setStatus("Saving...");
    const res = await fetch(`${API}/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      setStatus("Failed to update patient.");
      return;
    }

    const updated = await res.json();
    setPatient(updated);
    setIsEditing(false);
    setStatus("Patient updated successfully.");
  }

  useEffect(() => { load(); }, [id]);

  async function newEncounter() {
    const payment_type = "umum";
    const res = await fetch(`${API}/api/encounters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ patient_id: id, payment_type }),
    });
    if (!res.ok) { setStatus("Failed to create encounter."); return; }
    const enc = await res.json();
    window.location.href = `/encounters/${enc.id}`;
  }

  async function deletePatient() {
    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${patient?.full_name}"?\n\nThis action cannot be undone and will delete all associated encounters.`
    );

    if (!confirmed) return;

    try {
      setStatus("Deleting patient...");
      const res = await fetch(`${API}/api/patients/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const error = await res.text();
        setStatus(`Failed to delete patient: ${error}`);
        return;
      }

      alert("Patient deleted successfully");
      router.push("/patients");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  const age = patient?.dob ? calculateAge(patient.dob) : patient?.age_years;

  return (
    <div className="grid">
      <div className="card">
        <h1 className="h1">Patient Identity</h1>

        {patient && (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div className="row" style={{ gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Full Name
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    value={formData.full_name || ""}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.full_name}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Medical Record Number
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    value={formData.rm_number || ""}
                    onChange={e => setFormData({ ...formData, rm_number: e.target.value })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.rm_number || "-"}
                  </div>
                )}
              </div>
            </div>

            <div className="row" style={{ gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Date of Birth
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    type="date"
                    value={formData.dob || ""}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.dob ? new Date(patient.dob).toLocaleDateString('id-ID') : "-"}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Age
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    type="number"
                    value={formData.age_years || ""}
                    onChange={e => setFormData({ ...formData, age_years: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {age ? `${age} years` : "-"}
                  </div>
                )}
              </div>
            </div>

            <div className="row" style={{ gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Sex
                </div>
                {isEditing ? (
                  <select
                    className="input"
                    value={formData.sex || ""}
                    onChange={e => setFormData({ ...formData, sex: e.target.value })}
                  >
                    <option value="">-</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.sex || "-"}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Referral Source
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    value={formData.referral_source || ""}
                    onChange={e => setFormData({ ...formData, referral_source: e.target.value })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.referral_source || "-"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                Address
              </div>
              {isEditing ? (
                <textarea
                  className="input"
                  value={formData.address || ""}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{ minHeight: 60 }}
                />
              ) : (
                <div className="p" style={{ fontWeight: 700 }}>
                  {patient.address || "-"}
                </div>
              )}
            </div>

            <div className="row" style={{ gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="p" style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>
                  Phone Number
                </div>
                {isEditing ? (
                  <input
                    className="input"
                    value={formData.phone || ""}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <div className="p" style={{ fontWeight: 700 }}>
                    {patient.phone || "-"}
                  </div>
                )}
              </div>
            </div>

            <div className="row" style={{ marginTop: 10, gap: 10 }}>
              {!isEditing && (
                <button className="btn" onClick={() => setIsEditing(true)}>Edit Identity</button>
              )}
              {isEditing && (
                <>
                  <button className="btn btnPrimary" onClick={savePatient}>Save Changes</button>
                  <button className="btn" onClick={() => { setIsEditing(false); setFormData(patient); }}>Cancel</button>
                </>
              )}
            </div>

          </div>
        )}

        <div className="row" style={{ marginTop: 20, gap: 10, flexWrap: "wrap" }}>
          <button className="btn btnPrimary" onClick={newEncounter}>New Encounter</button>
          <a className="btn" href="/patients">Back to Patients</a>
          <button
            className="btn"
            onClick={deletePatient}
            style={{
              background: "#dc2626",
              borderColor: "#dc2626",
              marginLeft: "auto"
            }}
          >
            Delete Patient
          </button>
        </div>
        <div style={{ marginTop: 10 }} className="p">{status}</div>
      </div>

      <div className="card">
        <h2 className="h1" style={{ fontSize: 16 }}>Encounters</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {encounters.map(e => (
            <div key={e.id} className="card" style={{ padding: 12, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{new Date(e.visit_datetime).toLocaleString()}</div>
                  <div className="p">Nurse: {e.status_nurse} | Doctor: {e.status_doctor}</div>
                </div>
                <a className="btn" href={`/encounters/${e.id}`}>Open</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
