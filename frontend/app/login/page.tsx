"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState("doctor@bprc.local");
  const [password, setPassword] = useState("Doctor123!");
  const [status, setStatus] = useState<string>("");

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);
      setStatus(`OK. Logged in as ${data.full_name} (${data.role}). Redirecting...`);
      window.location.href = "/patients";
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: "40px 32px", textAlign: "center" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div className="logoBox" style={{ width: 56, height: 56, fontSize: 20 }}>SM</div>
        </div>

        <h1 className="h1">SayMed</h1>
        <p className="p" style={{ marginBottom: 32 }}>Type Less. Say More.</p>

        <form onSubmit={onLogin} style={{ textAlign: "left" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@bprc.local" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>

            <button className="btn btnPrimary" type="submit" style={{ marginTop: 8, width: "100%", padding: "12px 16px", fontSize: 16 }}>
              Sign in
            </button>

            {status && (
              <div className="p" style={{ textAlign: "center", marginTop: 8, color: status.includes("Error") ? "var(--danger)" : "var(--primary)" }}>
                {status}
              </div>
            )}

            <div className="p" style={{ textAlign: "center", marginTop: 16, fontSize: 12 }}>
              Default Roles: doctor@bprc.local | nurse@bprc.local | admin@bprc.local<br />
              Password: RoleName123!
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
