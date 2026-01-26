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
    <div className="card" style={{ maxWidth: 520 }}>
      <h1 className="h1">Login</h1>

      <form onSubmit={onLogin} style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
          <button className="btn btnPrimary" type="submit">Sign in</button>
          <div className="p">{status}</div>
        </div>
      </form>
    </div>
  );
}
