"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    async function autoLogin() {
      setStatus("Logging in as Doctor...");
      try {
        // Auto-login as doctor@bprc.id
        const res = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "doctor@bprc.id", password: "Doctor123!" })
        });

        if (!res.ok) throw new Error("Auto-login failed");

        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("full_name", data.full_name);

        setStatus("Redirecting...");
        router.push("/patients");
      } catch (err) {
        setStatus("Login failed. Please refresh.");
        console.error(err);
      }
    }

    autoLogin();
  }, [router]);

  return (
    <div className="card">
      <h1 className="h1">SayMed – Pain Edition (BPRC)</h1>
      <p className="p" style={{ marginTop: 20 }}>
        {status}
      </p>
    </div>
  );
}
