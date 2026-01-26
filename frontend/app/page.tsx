import Link from "next/link";

export default function Home() {
  return (
    <div className="card">
      <h1 className="h1">SayMed – Pain Edition (BPRC)</h1>
      <p className="p">
        Voice → Structured Clinical Documentation → Premium Print-Form PDF (Indonesia + English).
      </p>
      <div style={{ marginTop: 14 }} className="row">
        <Link href="/login" className="btn btnPrimary">
          Login
        </Link>
        <Link href="/patients" className="btn">
          Open Patients
        </Link>
      </div>
    </div>
  );
}
