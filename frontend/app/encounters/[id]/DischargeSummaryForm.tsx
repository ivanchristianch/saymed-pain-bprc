"use client";

import { useState, useEffect } from "react";

export interface DischargeSummaryData {
    admission_date: string | null;
    discharge_date: string | null;
    primary_diagnosis: string | null;
    secondary_diagnoses: string | null;
    clinical_course_summary: string | null;
    procedures_performed: string | null;
    medications_on_discharge: string | null;
    followup_plan: string | null;
    patient_education: string | null;
}

interface DischargeFormProps {
    encounterId: string;
    initialData?: DischargeSummaryData | null;
    role: string;
    onSave: (data: DischargeSummaryData) => Promise<void>;
    statusMsg?: string;
}

export default function DischargeSummaryForm({ encounterId, initialData, role, onSave, statusMsg }: DischargeFormProps) {
    const isDoctor = role === "doctor";
    const [data, setData] = useState<DischargeSummaryData>({
        admission_date: null,
        discharge_date: null,
        primary_diagnosis: null,
        secondary_diagnoses: null,
        clinical_course_summary: null,
        procedures_performed: null,
        medications_on_discharge: null,
        followup_plan: null,
        patient_education: null,
    });

    useEffect(() => {
        if (initialData) {
            setData((d) => ({ ...d, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (field: keyof DischargeSummaryData, val: any) => {
        setData((prev) => ({ ...prev, [field]: val }));
    };

    return (
        <div className="grid">
            <div className="form-group">
                <label className="form-label">Admission Date</label>
                <input type="date" className="input" disabled={!isDoctor} value={data.admission_date || ""} onChange={(e) => handleChange("admission_date", e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">Discharge Date</label>
                <input type="date" className="input" disabled={!isDoctor} value={data.discharge_date || ""} onChange={(e) => handleChange("discharge_date", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Primary Diagnosis</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.primary_diagnosis || ""} onChange={(e) => handleChange("primary_diagnosis", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Secondary Diagnoses</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.secondary_diagnoses || ""} onChange={(e) => handleChange("secondary_diagnoses", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Summary of Clinical Course</label>
                <textarea className="textarea" rows={4} disabled={!isDoctor} value={data.clinical_course_summary || ""} onChange={(e) => handleChange("clinical_course_summary", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Procedures Performed</label>
                <textarea className="textarea" rows={3} disabled={!isDoctor} value={data.procedures_performed || ""} onChange={(e) => handleChange("procedures_performed", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Medications on Discharge</label>
                <textarea className="textarea" rows={3} disabled={!isDoctor} value={data.medications_on_discharge || ""} onChange={(e) => handleChange("medications_on_discharge", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Follow-up Plan & Control Schedule</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.followup_plan || ""} onChange={(e) => handleChange("followup_plan", e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Patient Education Notes</label>
                <textarea className="textarea" rows={2} disabled={!isDoctor} value={data.patient_education || ""} onChange={(e) => handleChange("patient_education", e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingBottom: 64 }}>
                <button className="btn" onClick={() => alert("Generate PDF specific to Discharge Summary")}>Export PDF</button>

                <div style={{ display: "flex", gap: 12 }}>
                    {statusMsg && <div className="p" style={{ display: "flex", alignItems: "center", color: "var(--primary)" }}>{statusMsg}</div>}
                    {isDoctor && (
                        <button className="btn btnPrimary" onClick={() => onSave(data)}>
                            Save Discharge Summary
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
