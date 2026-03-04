"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

type Patient = {
  id: string;
  full_name: string;
  age_years: number;
  rm_number?: string | null;
};

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper to calc age
function calculateAge(dobStr: string) {
  if (!dobStr) return { years: 0, months: 0, days: 0 };
  const birthDate = new Date(dobStr);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  return { years, months, days };
}

export default function PatientsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    bloodGroup: "",
    maritalStatus: "",
    rmNumber: ""
  });

  async function load() {
    setStatus("Loading...");
    const res = await fetch(`${API}/api/patients?search=${encodeURIComponent(search)}`, { headers: authHeaders() });
    if (!res.ok) {
      setStatus("Not authorized or backend unavailable. Please login.");
      return;
    }
    const data = await res.json();
    setItems(data);
    setStatus(`Loaded ${data.length} patients.`);
  }

  useEffect(() => { load(); }, []);

  const ageData = calculateAge(formData.dob);
  const ageDisplay = formData.dob ? `${ageData.years} Years, ${ageData.months} Months, ${ageData.days} Days` : "";

  async function handleAddPatient(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating patient...");

    const payload = {
      full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      age_years: parseInt(ageData.years.toString(), 10) || 0,
      rm_number: formData.rmNumber || null,
      dob: formData.dob ? formData.dob : null,
      address: formData.address || null,
      blood_group: formData.bloodGroup || null,
      marital_status: formData.maritalStatus || null,
    };

    // Create Patient
    let pRes = await fetch(`${API}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });

    if (!pRes.ok) {
      let errMsg = "Unknown error";
      try {
        const err = await pRes.json();
        errMsg = err.detail || JSON.stringify(err);
      } catch (e) {
        errMsg = await pRes.text();
      }
      setStatus(`Failed to create patient: ${errMsg}`);
      return;
    }
    const patientData = await pRes.json();

    // Auto Create Draft Encounter
    const eRes = await fetch(`${API}/api/encounters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        patient_id: patientData.id,
        payment_type: "umum", // default
      })
    });

    if (!eRes.ok) {
      setStatus("Patient created, but failed to create encounter.");
      await load();
      setShowForm(false);
      return;
    }

    // Redirect to encounter page
    router.push(`/encounters/${patientData.id}`);
  }

  async function deletePatient(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const res = await fetch(`${API}/api/patients/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) {
      alert("Failed to delete patient.");
      return;
    }
    load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h1 className="h1">Patients</h1>
        <p className="p">Search, create a patient, or open an encounter to begin the clinical documentation process.</p>

        <div style={{ marginTop: 24, marginBottom: 16 }} className="row">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name..." />
          <button className="btn btnPrimary" onClick={load}>Search</button>
        </div>

        <div className="row">
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add New Patient"}
          </button>
          <a href="/login" className="btn">Login</a>
        </div>

        {showForm && (
          <form onSubmit={handleAddPatient} style={{ marginTop: 24, padding: 16, border: "1px solid var(--line)", borderRadius: "var(--radius2)", background: "var(--bg)" }}>
            <h3 className="h3" style={{ marginBottom: 16 }}>New Patient Info</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>First Name *</label>
                <input required className="input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Last Name *</label>
                <input required className="input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Date of Birth *</label>
                <input required type="date" className="input" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
              </div>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Age</label>
                <input className="input" value={ageDisplay} disabled style={{ backgroundColor: "var(--line)", color: "var(--text)", width: "100%" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Medical Record Number (RM)</label>
                <input className="input" value={formData.rmNumber} onChange={e => setFormData({ ...formData, rmNumber: e.target.value })} />
              </div>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Blood Group</label>
                <select className="input" style={{ width: "100%" }} value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                  <option value="">- Select -</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="p" style={{ display: "block", marginBottom: 4 }}>Marital Status</label>
                <select className="input" style={{ width: "100%" }} value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                  <option value="">- Select -</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="p" style={{ display: "block", marginBottom: 4 }}>Address</label>
              <textarea className="input" style={{ width: "100%", minHeight: 60 }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <button type="submit" className="btn btnPrimary">Save & Open Encounter</button>
          </form>
        )}

        {status && <div style={{ marginTop: 16 }} className="p">{status}</div>}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="h2" style={{ margin: 0 }}>Patient List</h2>
          <span className="p" style={{ fontSize: 13, background: "var(--line)", padding: "2px 8px", borderRadius: 12 }}>{items.length} records</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.length === 0 ? (
            <div className="p" style={{ textAlign: "center", padding: "32px 0" }}>No patients found. Create one to get started.</div>
          ) : (
            items.map(p => (
              <div key={p.id} style={{
                padding: 16,
                border: "1px solid var(--line)",
                borderRadius: "var(--radius2)",
                background: "var(--bg)",
                transition: "all 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 15, marginBottom: 4 }}>{p.full_name}</div>
                    <div className="p">Age: {p.age_years} • MRN: {p.rm_number || "Unassigned"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a className="btn btnPrimary" href={`/encounters/${p.id}`} style={{ padding: "8px 16px" }}>Open Encounter</a>
                    <button
                      className="btn btnDanger"
                      onClick={() => deletePatient(p.id, p.full_name)}
                      style={{ padding: "8px 12px" }}
                      title="Delete Patient"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div >
  )
}
