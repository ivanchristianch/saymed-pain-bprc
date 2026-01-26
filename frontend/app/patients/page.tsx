"use client";

import { useEffect, useState } from "react";

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

export default function PatientsPage() {
  const [items, setItems] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

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

  async function createDemo() {
    const payload = {
      full_name: "Pasien Demo BPRC",
      age_years: 48,
      rm_number: "RM-0001"
    };
    const res = await fetch(`${API}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setStatus("Failed to create patient.");
      return;
    }
    await load();
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
        <p className="p">Search, create patient, then start an encounter (nurse/doctor).</p>

        <div style={{ marginTop: 14 }} className="row">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name..." />
          <button className="btn" onClick={load}>Search</button>
        </div>

        <div style={{ marginTop: 10 }} className="row">
          <button className="btn btnPrimary" onClick={createDemo}>Create demo patient</button>
          <a className="btn" href="/login">Login</a>
        </div>

        <div style={{ marginTop: 12 }} className="p">{status}</div>
      </div>

      <div className="card">
        <h2 className="h1" style={{ fontSize: 16 }}>Patient list</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {items.map(p => (
            <div key={p.id} className="card" style={{ padding: 12, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.full_name}</div>
                  <div className="p">Age: {p.age_years} | RM: {p.rm_number || "-"}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a className="btn" href={`/patients/${p.id}`}>Open</a>
                  <button
                    className="btn"
                    style={{ background: "#dc2626", borderColor: "#dc2626", fontSize: 12, padding: "4px 8px" }}
                    onClick={() => deletePatient(p.id, p.full_name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
