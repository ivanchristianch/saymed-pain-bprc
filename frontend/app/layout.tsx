import "./globals.css";

export const metadata = {
  title: "SayMed – Pain Edition (BPRC)",
  description: "Premium clinical documentation (voice → structured → print-form).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="appShell">
          <header className="topbar">
            <div className="brand">
              <div className="logoBox">SM</div>
              <div>
                <div className="brandTitle">SayMed – Pain Edition</div>
                <div className="brandSub">Type Less. Say More.</div>
              </div>
            </div>
            {/* Global Recording Bar Placeholder - to be managed via state or context later, 
                for now we can just leave space or move to a client component if needed. */}
            <div id="global-recording-container"></div>
            <nav className="nav">
              <a href="/patients">Patients</a>
              <a href="/login" className="btn btnPrimary" style={{ padding: "6px 16px", color: "white" }}>Login</a>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
