"use client";

import { useState } from "react";

export interface CorrespondenceData {
    id?: string;
    document_type: string;
    recipient: string | null;
    subject: string | null;
    body_text: string | null;
    attachment_file_id?: string | null;
}

interface CorrespondenceFormProps {
    encounterId: string;
    initialData?: CorrespondenceData[];
    role: string;
    onSaveNew: (data: CorrespondenceData) => Promise<void>;
    statusMsg?: string;
}

export default function CorrespondenceForm({ encounterId, initialData = [], role, onSaveNew, statusMsg }: CorrespondenceFormProps) {
    const isDoctor = role === "doctor";

    // New draft state
    const [draft, setDraft] = useState<CorrespondenceData>({
        document_type: "Referral letter",
        recipient: "",
        subject: "",
        body_text: "",
    });

    const handleChange = (field: keyof CorrespondenceData, val: any) => {
        setDraft((prev) => ({ ...prev, [field]: val }));
    };

    const handleSaveDraft = async () => {
        if (!draft.document_type) return alert("Select a document type.");
        await onSaveNew(draft);
        setDraft({
            document_type: "Referral letter",
            recipient: "",
            subject: "",
            body_text: "",
        });
    };

    return (
        <div className="grid">
            <div style={{ gridColumn: "1 / -1", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
                <h3 className="h3" style={{ marginBottom: 16 }}>Existing Correspondence Documents</h3>
                {initialData.length === 0 ? (
                    <p className="p" style={{ fontStyle: "italic", color: "var(--textMuted)" }}>No correspondence documents drafted yet.</p>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {initialData.map((doc, i) => (
                            <div key={doc.id || i} className="card" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <strong style={{ display: "block", color: "var(--primary)" }}>{doc.document_type}</strong>
                                        <div style={{ fontSize: 14, color: "var(--textMuted)" }}>To: {doc.recipient || "N/A"}</div>
                                        <div style={{ fontSize: 14, color: "var(--textMuted)" }}>Subject: {doc.subject || "N/A"}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button className="btn" onClick={() => alert("Generate PDF (ID) for Document")}>Export PDF (ID)</button>
                                        <button className="btn" onClick={() => alert("Generate PDF (EN) for Document")}>Export PDF (EN)</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <h3 className="h3" style={{ gridColumn: "1 / -1", marginBottom: 16 }}>Draft New Document</h3>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Document Type</label>
                <select className="input" disabled={!isDoctor} value={draft.document_type} onChange={(e) => handleChange("document_type", e.target.value)}>
                    <option value="Referral letter">Referral letter</option>
                    <option value="Reply to referral">Reply to referral</option>
                    <option value="Medical certificate">Medical certificate (Surat Keterangan Sakit)</option>
                    <option value="Insurance letter">Insurance letter</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Recipient Institution / Doctor</label>
                <input className="input" disabled={!isDoctor} value={draft.recipient || ""} onChange={(e) => handleChange("recipient", e.target.value)} placeholder="e.g. Dr. Budi, RS Medika" />
            </div>

            <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="input" disabled={!isDoctor} value={draft.subject || ""} onChange={(e) => handleChange("subject", e.target.value)} placeholder="e.g. Neurology Referral" />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Body Text (Formal Medical Style)</label>
                <textarea className="textarea" rows={6} disabled={!isDoctor} value={draft.body_text || ""} onChange={(e) => handleChange("body_text", e.target.value)} placeholder="Dear Colleague, I am referring this patient with..." style={{ fontFamily: "monospace" }} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                <label className="form-label">Attachments</label>
                <div style={{ border: "1px dashed var(--line)", padding: 16, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", gap: 16 }}>
                    <button className="btn" disabled={!isDoctor} onClick={() => alert("File upload modal placeholder")}>Upload External PDF</button>
                    <span className="p" style={{ fontSize: 13, color: "var(--textMuted)" }}>Optional: Attach lab results or previous letters.</span>
                </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingBottom: 64 }}>
                {statusMsg && <div className="p" style={{ display: "flex", alignItems: "center", color: "var(--primary)" }}>{statusMsg}</div>}
                {isDoctor && (
                    <button className="btn btnPrimary" onClick={handleSaveDraft}>
                        Save Document to Chart
                    </button>
                )}
            </div>
        </div>
    );
}
