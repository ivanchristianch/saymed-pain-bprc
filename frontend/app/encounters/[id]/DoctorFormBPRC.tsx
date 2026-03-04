"use client";

import React, { useEffect, useMemo, useState } from "react";

export type SymptomOnsetRange =
  | "1M"
  | "1M-1B"
  | "1B-3B"
  | "3B-1T"
  | "1T-5T"
  | "5T-10T";

export type PastHistoryKey =
  | "Hipertensi"
  | "DM"
  | "Gastritis"
  | "AsamUrat"
  | "Jantung"
  | "Ginjal"
  | "Liver"
  | "Kanker"
  | "Kolesterol"
  | "Stroke"
  | "Autoimun"
  | "Trauma";

export type AllergyKey =
  | "Obat"
  | "Debu"
  | "Makanan"
  | "ZatKimia"
  | "Cuaca"
  | "SinarMatahari";

export type NutritionStatus = "GiziKurangBuruk" | "GiziCukup" | "GiziLebih";

export type NeuroRowKey =
  | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8"
  | "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8" | "T9" | "T10" | "T11" | "T12"
  | "L1" | "L2" | "L3" | "L4" | "L5"
  | "S1" | "S2" | "S3" | "S4"
  | "RefleksFisiologis"
  | "RefleksPatologis";

export type DoctorBPRCData = {
  keluhan_utama: string;

  riwayat_pengobatan_diagnosis_sebelumnya: string;
  status_post_op: boolean;
  status_post_tindakan: boolean;
  onset_range: SymptomOnsetRange | "";

  obat_sedang_diminum: string;

  rpd: Record<PastHistoryKey, boolean>;
  rpk: string;

  riwayat_alergi: Record<AllergyKey, boolean>;
  riwayat_alergi_lainnya: string;

  anamnesis: string;
  anamnesis_checkbox: {
    baal: boolean;
    kesemutan: boolean;
    sakit_kepala: boolean;
  };
  kualitas_tidur: string;
  gangguan_bak_bab: string;
  gangguan_makan: string;
  adl: string;
  or: string;

  status_gizi: NutritionStatus | "";
  alat_bantu_jalan: string;

  pemeriksaan_fisik: {
    cranial_nerve: string; // CN I-XII + GBM
    romberg_tandem: string;
    pain_detect: {
      sensory_descriptors: string;
      spatial_temporal: string;
      score: string;
      interpretasi: string;
    };
    phq9_score: string;
  };

  muskuloskeletal: {
    head_neck: string;
    shoulder: string;
    elbow: string;
    wrist: string;
    back: string;
    genu: string;
    pedis: string;
  };

  neurologis: {
    rows: Record<NeuroRowKey, { motorik: string; sensorik: string }>;
  };

  lain_lain: {
    darah_rutin: string;
    usg_doppler: string;
    mri_ct: string;
    pet_scan: string;
    imunohistokimia: string;
  };

  diagnosis_banding: string;
  diagnosis_kerja: string;

  penatalaksanaan: {
    goal: string;
    pro_usg_ipm: string;
  };

  jadwal_kontrol: {
    tanggal: string;
    jam: string;
  };
};

function createInitialNeuroRows(): DoctorBPRCData["neurologis"]["rows"] {
  const keys: NeuroRowKey[] = [
    "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
    "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
    "L1", "L2", "L3", "L4", "L5",
    "S1", "S2", "S3", "S4",
    "RefleksFisiologis",
    "RefleksPatologis",
  ];

  const obj = {} as Record<NeuroRowKey, { motorik: string; sensorik: string }>;
  for (const k of keys) obj[k] = { motorik: "", sensorik: "" };
  return obj;
}

function initialData(): DoctorBPRCData {
  return {
    keluhan_utama: "",

    riwayat_pengobatan_diagnosis_sebelumnya: "",
    status_post_op: false,
    status_post_tindakan: false,
    onset_range: "",

    obat_sedang_diminum: "",

    rpd: {
      Hipertensi: false,
      DM: false,
      Gastritis: false,
      AsamUrat: false,
      Jantung: false,
      Ginjal: false,
      Liver: false,
      Kanker: false,
      Kolesterol: false,
      Stroke: false,
      Autoimun: false,
      Trauma: false,
    },
    rpk: "",

    riwayat_alergi: {
      Obat: false,
      Debu: false,
      Makanan: false,
      ZatKimia: false,
      Cuaca: false,
      SinarMatahari: false,
    },
    riwayat_alergi_lainnya: "",

    anamnesis: "",
    anamnesis_checkbox: {
      baal: false,
      kesemutan: false,
      sakit_kepala: false,
    },
    kualitas_tidur: "",
    gangguan_bak_bab: "",
    gangguan_makan: "",
    adl: "",
    or: "",

    status_gizi: "",
    alat_bantu_jalan: "",

    pemeriksaan_fisik: {
      cranial_nerve: "",
      romberg_tandem: "",
      pain_detect: {
        sensory_descriptors: "",
        spatial_temporal: "",
        score: "",
        interpretasi: "",
      },
      phq9_score: "",
    },

    muskuloskeletal: {
      head_neck: "",
      shoulder: "",
      elbow: "",
      wrist: "",
      back: "",
      genu: "",
      pedis: "",
    },

    neurologis: {
      rows: createInitialNeuroRows(),
    },

    lain_lain: {
      darah_rutin: "",
      usg_doppler: "",
      mri_ct: "",
      pet_scan: "",
      imunohistokimia: "",
    },

    diagnosis_banding: "",
    diagnosis_kerja: "",

    penatalaksanaan: {
      goal: "",
      pro_usg_ipm: "",
    },

    jadwal_kontrol: {
      tanggal: "",
      jam: "",
    },
  };
}

/** ========= MERGE HELPERS (prefer existing) ========= */
function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (v === "") return true;
  // boolean false is a valid value (don’t treat as empty)
  return false;
}

function mergeDeepPreferExisting<T extends Record<string, any>>(existing: T, incoming: Partial<T>): T {
  const out: any = Array.isArray(existing) ? [...existing] : { ...existing };

  for (const key of Object.keys(incoming || {})) {
    const incVal: any = (incoming as any)[key];
    const exVal: any = (existing as any)[key];

    if (incVal === undefined) continue;

    const incIsObj =
      incVal &&
      typeof incVal === "object" &&
      !Array.isArray(incVal) &&
      !(incVal instanceof Date);

    const exIsObj =
      exVal &&
      typeof exVal === "object" &&
      !Array.isArray(exVal) &&
      !(exVal instanceof Date);

    if (incIsObj && exIsObj) {
      out[key] = mergeDeepPreferExisting(exVal, incVal);
      continue;
    }

    if (isEmptyValue(exVal)) out[key] = incVal;
    else out[key] = exVal;
  }

  return out as T;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div className="h2" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6, opacity: 0.9, fontWeight: 600 }}>
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.20)",
        color: "white",
        outline: "none",
      }}
    />
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.20)",
        color: "white",
        outline: "none",
      }}
    />
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span style={{ opacity: 0.92 }}>{label}</span>
    </label>
  );
}

function ChipRadio<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="btn"
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              background: active ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.18)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** ========= NEW PROPS SIGNATURE ========= */
type Props = {
  encounterId: string;
  onSave: (data: DoctorBPRCData) => Promise<void> | void;
  saving?: boolean;

  /**
   * ✅ NEW:
   * Hasil auto-fill dari transkrip/extractor.
   * Akan di-merge tanpa overwrite input manual.
   */
  prefill?: Partial<DoctorBPRCData> | null;
  /**
   * ✅ NEW: Data loaded from backend (persisted).
   */
  initialData?: DoctorBPRCData | null;
  audioFilename?: string | null;
};

export default function DoctorFormBPRC({ encounterId, onSave, saving, prefill, initialData: serverInitialData, audioFilename }: Props) {
  const storageKey = useMemo(() => `doctor_bprc_${encounterId}`, [encounterId]);

  const [data, setData] = useState<DoctorBPRCData>(() => initialData());

  const [localSaving, setLocalSaving] = useState(false);

  const effectiveSaving = !!saving || localSaving;

  // load draft from localStorage OR valid initialData prop
  useEffect(() => {
    if (!encounterId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setData(JSON.parse(raw));
      } else if (serverInitialData) {
        setData(serverInitialData);
      }
    } catch {
      // ignore
    }
  }, [encounterId, storageKey, serverInitialData]);

  // Handle late-loading initialData
  useEffect(() => {
    if (!serverInitialData) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setData(serverInitialData);
    }
  }, [serverInitialData, storageKey]);

  /** ✅ merge prefill when it changes */
  useEffect(() => {
    if (!prefill) return;
    setData((prev) => {
      const merged = mergeDeepPreferExisting(prev, prefill);

      // ensure neuro rows always exist (avoid missing keys from prefill)
      if (!merged.neurologis?.rows) {
        merged.neurologis = { rows: createInitialNeuroRows() };
      } else {
        const base = createInitialNeuroRows();
        merged.neurologis.rows = { ...base, ...merged.neurologis.rows };
      }

      // keep painDetect interpretasi auto unless overridden
      // (we do not force here; UI already shows auto interpret when blank)
      return merged;
    });
  }, [prefill]);

  const phq9Info = useMemo(() => {
    const s = Number(data.pemeriksaan_fisik.phq9_score);
    if (Number.isNaN(s)) return "";
    if (s <= 4) return "1–4: minimal";
    if (s <= 9) return "5–9: mild";
    if (s <= 14) return "10–14: moderate";
    if (s <= 19) return "15–19: moderately severe";
    return "20–27: severe";
  }, [data.pemeriksaan_fisik.phq9_score]);

  const painDetectInterpret = useMemo(() => {
    const score = Number(data.pemeriksaan_fisik.pain_detect.score);
    if (Number.isNaN(score)) return "";
    if (score > 19) return ">19: likely neuropathic pain";
    if (score < 12) return "<12: unlikely neuropathic pain";
    return "13–18: mixed pain";
  }, [data.pemeriksaan_fisik.pain_detect.score]);

  async function handleSave() {
    try {
      setLocalSaving(true);
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // ignore
      }
      await onSave(data);
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 22 }}>
      <h1 className="h1">Pengkajian Medis Dokter</h1>

      <Section title="Keluhan Utama">
        <TextArea
          value={data.keluhan_utama}
          onChange={(v) => setData((p) => ({ ...p, keluhan_utama: v }))}
          placeholder="Keluhan utama pasien..."
          rows={3}
        />
      </Section>

      <Section title="Riwayat Pengobatan & Diagnosis Sebelumnya">
        <FieldLabel>Catatan / diagnosis / terapi sebelumnya</FieldLabel>
        <TextArea
          value={data.riwayat_pengobatan_diagnosis_sebelumnya}
          onChange={(v) =>
            setData((p) => ({ ...p, riwayat_pengobatan_diagnosis_sebelumnya: v }))
          }
          placeholder="Tuliskan diagnosis dan terapi sebelumnya..."
          rows={3}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Checkbox
            checked={data.status_post_op}
            onChange={(v) => setData((p) => ({ ...p, status_post_op: v }))}
            label="Post op"
          />
          <Checkbox
            checked={data.status_post_tindakan}
            onChange={(v) => setData((p) => ({ ...p, status_post_tindakan: v }))}
            label="Post tindakan"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>Mulainya gejala sejak</FieldLabel>
          <ChipRadio<SymptomOnsetRange>
            value={data.onset_range}
            onChange={(v) => setData((p) => ({ ...p, onset_range: v }))}
            options={[
              { value: "1M", label: "1M" },
              { value: "1M-1B", label: "1M–1B" },
              { value: "1B-3B", label: "1B–3B" },
              { value: "3B-1T", label: "3B–1T" },
              { value: "1T-5T", label: "1T–5T" },
              { value: "5T-10T", label: "5T–10T" },
            ]}
          />
        </div>
      </Section>

      <Section title="Obat yang Sedang Diminum">
        <TextArea
          value={data.obat_sedang_diminum}
          onChange={(v) => setData((p) => ({ ...p, obat_sedang_diminum: v }))}
          placeholder="Nama obat, dosis, frekuensi..."
          rows={3}
        />
      </Section>

      <Section title="Riwayat Penyakit Dahulu (RPD)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {(Object.keys(data.rpd) as PastHistoryKey[]).map((k) => (
            <Checkbox
              key={k}
              checked={data.rpd[k]}
              onChange={(v) =>
                setData((p) => ({
                  ...p,
                  rpd: { ...p.rpd, [k]: v },
                }))
              }
              label={k}
            />
          ))}
        </div>
      </Section>

      <Section title="Riwayat Penyakit Keluarga (RPK)">
        <TextArea
          value={data.rpk}
          onChange={(v) => setData((p) => ({ ...p, rpk: v }))}
          placeholder="Tuliskan riwayat penyakit keluarga..."
          rows={3}
        />
      </Section>

      <Section title="Riwayat Alergi">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {(Object.keys(data.riwayat_alergi) as AllergyKey[]).map((k) => (
            <Checkbox
              key={k}
              checked={data.riwayat_alergi[k]}
              onChange={(v) =>
                setData((p) => ({
                  ...p,
                  riwayat_alergi: { ...p.riwayat_alergi, [k]: v },
                }))
              }
              label={k}
            />
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <FieldLabel>Lainnya (optional)</FieldLabel>
          <Input
            value={data.riwayat_alergi_lainnya}
            onChange={(v) => setData((p) => ({ ...p, riwayat_alergi_lainnya: v }))}
            placeholder="Tambahkan detail alergi lain..."
          />
        </div>
      </Section>

      <Section title="Anamnesis">
        <TextArea
          value={data.anamnesis}
          onChange={(v) => setData((p) => ({ ...p, anamnesis: v }))}
          placeholder="Narasi anamnesis..."
          rows={4}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Checkbox
            checked={data.anamnesis_checkbox.baal}
            onChange={(v) =>
              setData((p) => ({ ...p, anamnesis_checkbox: { ...p.anamnesis_checkbox, baal: v } }))
            }
            label="Baal"
          />
          <Checkbox
            checked={data.anamnesis_checkbox.kesemutan}
            onChange={(v) =>
              setData((p) => ({
                ...p,
                anamnesis_checkbox: { ...p.anamnesis_checkbox, kesemutan: v },
              }))
            }
            label="Kesemutan"
          />
          <Checkbox
            checked={data.anamnesis_checkbox.sakit_kepala}
            onChange={(v) =>
              setData((p) => ({
                ...p,
                anamnesis_checkbox: { ...p.anamnesis_checkbox, sakit_kepala: v },
              }))
            }
            label="Sakit kepala"
          />
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <FieldLabel>Kualitas tidur</FieldLabel>
            <Input
              value={data.kualitas_tidur}
              onChange={(v) => setData((p) => ({ ...p, kualitas_tidur: v }))}
              placeholder="Baik / terganggu / dll..."
            />
          </div>
          <div>
            <FieldLabel>Gangguan BAK/BAB</FieldLabel>
            <Input
              value={data.gangguan_bak_bab}
              onChange={(v) => setData((p) => ({ ...p, gangguan_bak_bab: v }))}
              placeholder="Tidak ada / ada..."
            />
          </div>
          <div>
            <FieldLabel>Gangguan makan</FieldLabel>
            <Input
              value={data.gangguan_makan}
              onChange={(v) => setData((p) => ({ ...p, gangguan_makan: v }))}
              placeholder="Tidak ada / ada..."
            />
          </div>
          <div>
            <FieldLabel>ADL</FieldLabel>
            <Input
              value={data.adl}
              onChange={(v) => setData((p) => ({ ...p, adl: v }))}
              placeholder="Mandiri / dibantu..."
            />
          </div>
          <div>
            <FieldLabel>OR</FieldLabel>
            <Input
              value={data.or}
              onChange={(v) => setData((p) => ({ ...p, or: v }))}
              placeholder="Aktivitas olahraga..."
            />
          </div>
        </div>
      </Section>

      <Section title="Status Gizi & Alat Bantu Jalan">
        <FieldLabel>Status gizi</FieldLabel>
        <ChipRadio<NutritionStatus>
          value={data.status_gizi}
          onChange={(v) => setData((p) => ({ ...p, status_gizi: v }))}
          options={[
            { value: "GiziKurangBuruk", label: "Gizi kurang/buruk" },
            { value: "GiziCukup", label: "Gizi cukup" },
            { value: "GiziLebih", label: "Gizi lebih" },
          ]}
        />

        <div style={{ marginTop: 12 }}>
          <FieldLabel>Alat bantu jalan</FieldLabel>
          <Input
            value={data.alat_bantu_jalan}
            onChange={(v) => setData((p) => ({ ...p, alat_bantu_jalan: v }))}
            placeholder="Kursi roda / tongkat / walker / tidak ada..."
          />
        </div>
      </Section>

      <Section title="Pemeriksaan Fisik">
        <FieldLabel>1) Cranial Nerve I–XII + GBM</FieldLabel>
        <TextArea
          value={data.pemeriksaan_fisik.cranial_nerve}
          onChange={(v) =>
            setData((p) => ({ ...p, pemeriksaan_fisik: { ...p.pemeriksaan_fisik, cranial_nerve: v } }))
          }
          placeholder="Tuliskan ringkas CN I–XII + GBM..."
          rows={3}
        />

        <div style={{ marginTop: 12 }}>
          <FieldLabel>2) Romberg test, tandem test</FieldLabel>
          <TextArea
            value={data.pemeriksaan_fisik.romberg_tandem}
            onChange={(v) =>
              setData((p) => ({ ...p, pemeriksaan_fisik: { ...p.pemeriksaan_fisik, romberg_tandem: v } }))
            }
            placeholder="Romberg / Tandem..."
            rows={2}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>3) Pain Detect Tool</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <div>
              <FieldLabel>7 sensory descriptors</FieldLabel>
              <Input
                value={data.pemeriksaan_fisik.pain_detect.sensory_descriptors}
                onChange={(v) =>
                  setData((p) => ({
                    ...p,
                    pemeriksaan_fisik: {
                      ...p.pemeriksaan_fisik,
                      pain_detect: { ...p.pemeriksaan_fisik.pain_detect, sensory_descriptors: v },
                    },
                  }))
                }
                placeholder="Catatan..."
              />
            </div>
            <div>
              <FieldLabel>2 spatial/temporal characteristics</FieldLabel>
              <Input
                value={data.pemeriksaan_fisik.pain_detect.spatial_temporal}
                onChange={(v) =>
                  setData((p) => ({
                    ...p,
                    pemeriksaan_fisik: {
                      ...p.pemeriksaan_fisik,
                      pain_detect: { ...p.pemeriksaan_fisik.pain_detect, spatial_temporal: v },
                    },
                  }))
                }
                placeholder="Catatan..."
              />
            </div>
            <div>
              <FieldLabel>Score</FieldLabel>
              <Input
                value={data.pemeriksaan_fisik.pain_detect.score}
                onChange={(v) =>
                  setData((p) => ({
                    ...p,
                    pemeriksaan_fisik: {
                      ...p.pemeriksaan_fisik,
                      pain_detect: { ...p.pemeriksaan_fisik.pain_detect, score: v, interpretasi: "" },
                    },
                  }))
                }
                placeholder="Angka..."
              />
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Interpretasi: {data.pemeriksaan_fisik.pain_detect.interpretasi || painDetectInterpret || "-"}
              </div>
              <div style={{ marginTop: 6, opacity: 0.7 }}>
                Catatan: &gt;19 likely, &lt;12 unlikely, 13–18 mixed. Sens 85% Spec 80%.
              </div>
            </div>
            <div>
              <FieldLabel>Interpretasi (opsional override)</FieldLabel>
              <Input
                value={data.pemeriksaan_fisik.pain_detect.interpretasi}
                onChange={(v) =>
                  setData((p) => ({
                    ...p,
                    pemeriksaan_fisik: {
                      ...p.pemeriksaan_fisik,
                      pain_detect: { ...p.pemeriksaan_fisik.pain_detect, interpretasi: v },
                    },
                  }))
                }
                placeholder="Isi jika mau override otomatis..."
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>PHQ-9 Score</FieldLabel>
          <Input
            value={data.pemeriksaan_fisik.phq9_score}
            onChange={(v) =>
              setData((p) => ({ ...p, pemeriksaan_fisik: { ...p.pemeriksaan_fisik, phq9_score: v } }))
            }
            placeholder="0–27"
          />
          <div style={{ marginTop: 6, opacity: 0.8 }}>Kategori: {phq9Info || "-"}</div>
          <div style={{ marginTop: 6, opacity: 0.7 }}>
            1–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe
          </div>
        </div>
      </Section>

      <Section title="Pemeriksaan Muskuloskeletal">
        <FieldLabel>A. Head & Neck</FieldLabel>
        <TextArea
          value={data.muskuloskeletal.head_neck}
          onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, head_neck: v } }))}
          placeholder="Flexion/Extension/RB/LB/Rot/ROM/NG/NT/Spurling/Distraction/Neck calliet/TTH..."
          rows={3}
        />

        <div style={{ marginTop: 12 }}>
          <FieldLabel>B. Shoulder</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.shoulder}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, shoulder: v } }))}
            placeholder="ROM/NG aktif/abduksi/fleksi/HK/APT/other..."
            rows={3}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>C. Elbow</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.elbow}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, elbow: v } }))}
            placeholder="Wrist extension/flexion/NT lat epic/NT mid epic/lain-lain..."
            rows={2}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>D. Wrist</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.wrist}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, wrist: v } }))}
            placeholder="ROM/NG/NT/Prayer/Phalen/Froment/Tinnel..."
            rows={2}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>E. Back</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.back}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, back: v } }))}
            placeholder="Duduk↔Berdiri↔Jalan; Flex/Ext/RB/LB/Rot/ROM/NG/NT; SLR, Patrick, Contra Patrick, PT, HT, Hip abd/ext; Provokasi WFE..."
            rows={4}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>F. Genu</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.genu}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, genu: v } }))}
            placeholder="Duduk↔Berdiri↔Jalan; NWB AROM; ROM; Valgus/Varus/Infl/Krep/Lax/GFT/NG/NT..."
            rows={3}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>G. Pedis</FieldLabel>
          <TextArea
            value={data.muskuloskeletal.pedis}
            onChange={(v) => setData((p) => ({ ...p, muskuloskeletal: { ...p.muskuloskeletal, pedis: v } }))}
            placeholder="ROM/NG aktif/pasif; Flex/Ext/Inversi/Eversi; jalan jinjit/tumit; NT..."
            rows={3}
          />
        </div>
      </Section>

      <Section title="Pemeriksaan Neurologis (Motorik vs Sensorik)">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Level</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Motorik</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Sensorik</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(data.neurologis.rows) as NeuroRowKey[]).map((k) => (
                <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 10, width: 160, opacity: 0.9, fontWeight: 600 }}>{k}</td>
                  <td style={{ padding: 10 }}>
                    <input
                      value={data.neurologis.rows[k].motorik}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          neurologis: {
                            rows: {
                              ...p.neurologis.rows,
                              [k]: { ...p.neurologis.rows[k], motorik: e.target.value },
                            },
                          },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.20)",
                        color: "white",
                        outline: "none",
                      }}
                      placeholder="..."
                    />
                  </td>
                  <td style={{ padding: 10 }}>
                    <input
                      value={data.neurologis.rows[k].sensorik}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          neurologis: {
                            rows: {
                              ...p.neurologis.rows,
                              [k]: { ...p.neurologis.rows[k], sensorik: e.target.value },
                            },
                          },
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.20)",
                        color: "white",
                        outline: "none",
                      }}
                      placeholder="..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Lain-lain (Penunjang)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <FieldLabel>Darah rutin</FieldLabel>
            <TextArea
              value={data.lain_lain.darah_rutin}
              onChange={(v) => setData((p) => ({ ...p, lain_lain: { ...p.lain_lain, darah_rutin: v } }))}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>USG doppler</FieldLabel>
            <TextArea
              value={data.lain_lain.usg_doppler}
              onChange={(v) => setData((p) => ({ ...p, lain_lain: { ...p.lain_lain, usg_doppler: v } }))}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>MRI / CT Scan</FieldLabel>
            <TextArea
              value={data.lain_lain.mri_ct}
              onChange={(v) => setData((p) => ({ ...p, lain_lain: { ...p.lain_lain, mri_ct: v } }))}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>PET Scan</FieldLabel>
            <TextArea
              value={data.lain_lain.pet_scan}
              onChange={(v) => setData((p) => ({ ...p, lain_lain: { ...p.lain_lain, pet_scan: v } }))}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>Imunohistokimia</FieldLabel>
            <TextArea
              value={data.lain_lain.imunohistokimia}
              onChange={(v) => setData((p) => ({ ...p, lain_lain: { ...p.lain_lain, imunohistokimia: v } }))}
              rows={2}
            />
          </div>
        </div>
      </Section>

      <Section title="Diagnosis">
        <FieldLabel>Diagnosis banding</FieldLabel>
        <TextArea
          value={data.diagnosis_banding}
          onChange={(v) => setData((p) => ({ ...p, diagnosis_banding: v }))}
          rows={3}
        />
        <div style={{ marginTop: 12 }}>
          <FieldLabel>Diagnosis kerja</FieldLabel>
          <TextArea
            value={data.diagnosis_kerja}
            onChange={(v) => setData((p) => ({ ...p, diagnosis_kerja: v }))}
            rows={3}
          />
        </div>
      </Section>

      <Section title="Penatalaksanaan & Jadwal Kontrol">
        <FieldLabel>Goal</FieldLabel>
        <TextArea
          value={data.penatalaksanaan.goal}
          onChange={(v) => setData((p) => ({ ...p, penatalaksanaan: { ...p.penatalaksanaan, goal: v } }))}
          rows={2}
        />

        <div style={{ marginTop: 12 }}>
          <FieldLabel>Pro USG IPM</FieldLabel>
          <TextArea
            value={data.penatalaksanaan.pro_usg_ipm}
            onChange={(v) => setData((p) => ({ ...p, penatalaksanaan: { ...p.penatalaksanaan, pro_usg_ipm: v } }))}
            rows={2}
          />
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div>
            <FieldLabel>Jadwal kontrol (tanggal)</FieldLabel>
            <Input
              type="date"
              value={data.jadwal_kontrol.tanggal}
              onChange={(v) => setData((p) => ({ ...p, jadwal_kontrol: { ...p.jadwal_kontrol, tanggal: v } }))}
            />
          </div>
          <div>
            <FieldLabel>Jam</FieldLabel>
            <Input
              type="time"
              value={data.jadwal_kontrol.jam}
              onChange={(v) => setData((p) => ({ ...p, jadwal_kontrol: { ...p.jadwal_kontrol, jam: v } }))}
            />
          </div>
        </div>
      </Section>

      <div className="row" style={{ marginTop: 16 }}>
        <button
          className="btn btnPrimary"
          type="button"
          onClick={handleSave}
          disabled={effectiveSaving}
        >
          {effectiveSaving ? "Saving..." : "Save history"}
        </button>

        <button
          className="btn"
          type="button"
          onClick={() => setData(initialData())}
          disabled={effectiveSaving}
        >
          Reset
        </button>
      </div>
    </div >
  );
}
