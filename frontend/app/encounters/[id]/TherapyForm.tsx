"use client";

import { useState, useEffect } from "react";

export interface TherapyData {
    treatment_plan: string | null;
    medications_json: any[] | null;
    non_pharm_physio: string | null;
    non_pharm_lifestyle: string | null;
    non_pharm_education: string | null;
    procedures_performed: string | null;
    monitoring_notes: string | null;
}

interface TherapyFormProps {
    encounterId: string;
    initialData?: TherapyData | null;
    role: string;
    onSave: (data: TherapyData) => Promise<void>;
    statusMsg?: string;
}

export default function TherapyForm({ encounterId, initialData, role, onSave, statusMsg }: TherapyFormProps) {
    const isDoctor = role === "doctor";
    const [data, setData] = useState<TherapyData>({
        treatment_plan: null,
        medications_json: [],
        non_pharm_physio: null,
        non_pharm_lifestyle: null,
        non_pharm_education: null,
        procedures_performed: null,
        monitoring_notes: null,
    });

    useEffect(() => {
        if (initialData) {
            setData((d) => ({ ...d, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (field: keyof TherapyData, val: any) => {
        setData((prev) => ({ ...prev, [field]: val }));
    };

    const handleSaveClick = () => {
        onSave(data);
    };

    return (
        <div className="grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Treatment Plan</label>
                <textarea
                    className="textarea"
                    rows={3}
                    disabled={!isDoctor}
                    value={data.treatment_plan || ""}
                    onChange={(e) => handleChange("treatment_plan", e.target.value)}
                    placeholder="Overall treatment strategy..."
                />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Medications (Structured JSON Placeholder)</label>
                <textarea
                    className="textarea"
                    rows={3}
                    disabled={!isDoctor}
                    value={JSON.stringify(data.medications_json) === "[]" ? "" : JSON.stringify(data.medications_json, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            handleChange("medications_json", Array.isArray(parsed) ? parsed : []);
                        } catch (err) {
                            // For now, treat as malformed JSON string if user types; real app uses complex sub-forms
                        }
                    }}
                    placeholder='[{"drug": "Paracetamol", "dose": "500mg"}]'
                />
                <p className="p" style={{ fontSize: 12, marginTop: 4 }}>A structured medication builder will replace this text area in the future.</p>
            </div>

            <h3 className="h3" style={{ gridColumn: "1 / -1", marginTop: 16 }}>Non-Pharmacological Therapy</h3>
            <div className="form-group">
                <label className="form-label">Physiotherapy</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.non_pharm_physio || ""} onChange={(e) => handleChange("non_pharm_physio", e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">Lifestyle Modification</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.non_pharm_lifestyle || ""} onChange={(e) => handleChange("non_pharm_lifestyle", e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Patient Education</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.non_pharm_education || ""} onChange={(e) => handleChange("non_pharm_education", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: 16 }}>
                <label className="form-label">Procedures Performed (Optional)</label>
                <textarea className="textarea" rows={3} disabled={!isDoctor} value={data.procedures_performed || ""} onChange={(e) => handleChange("procedures_performed", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: 16 }}>
                <label className="form-label">Monitoring & Follow-up Notes</label>
                <textarea className="textarea" rows={3} disabled={!isDoctor} value={data.monitoring_notes || ""} onChange={(e) => handleChange("monitoring_notes", e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingBottom: 64 }}>
                {statusMsg && <div className="p" style={{ display: "flex", alignItems: "center", color: "var(--primary)" }}>{statusMsg}</div>}
                {isDoctor && (
                    <button className="btn btnPrimary" onClick={handleSaveClick}>
                        Save Therapy Data
                    </button>
                )}
            </div>
        </div>
    );
}
