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
              <div className="logoBox">BPRC</div>
              <div>
                <div className="brandTitle">SayMed – Pain Edition</div>
                <div className="brandSub">Premium Print-Form Documentation</div>
              </div>
            </div>
            <nav className="nav">
              <a href="/patients">Patients</a>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
