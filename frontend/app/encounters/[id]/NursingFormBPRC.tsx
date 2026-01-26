"use client";

import { useEffect, useMemo, useState } from "react";

export type YesNo = "ya" | "tidak";
export type TriState = "ya" | "tidak" | "";

export type NursingBPRCData = {
  keluhan_utama: string;

  alergi: {
    ada: boolean;
    sebutkan: string;
  };

  sosial_ekonomi: {
    pendidikan: string;
    pekerjaan: string;
    status: string;
    agama: string;
    bangsa: string;
    perjalanan_luar_negeri_2_minggu: TriState;
    hambatan_komunikasi: TriState;
    faktor_tradisi_keyakinan: TriState;
  };

  psikologi: {
    tenang: boolean;
    cemas: boolean;
    takut: boolean;
    marah: boolean;
    sedih: boolean;
    kecenderungan_bunuh_diri: boolean;
  };

  tanda_vital: {
    frekuensi_nadi: string;
    frekuensi_napas: string;
    tekanan_darah: string;
    suhu: string;
  };

  fungsional: {
    alat_bantu: string;
    prothesa: string;
    cacat_tubuh: string;
    adl: "mandiri" | "dibantu" | "";
  };

  skrining_nutrisi: {
    bb_turun_6_bulan: YesNo | "";
    selera_makan_turun: YesNo | "";
    berat_badan_kg: string;
    tinggi_badan_cm: string;
    imt: string; // auto-calc
    lingkar_kepala_cm: string;
    lingkar_pinggang_cm: string;
  };

  pengkajian_nyeri: {
    skala: string;
    lokasi: string;
    durasi: string;
    frekuensi: string;
    pola: "menetap" | "hilang_timbul" | "menjalar" | "";
    nyeri_hilang_bila: {
      minum_obat: boolean;
      mendengar_musik: boolean;
      istirahat: boolean;
      berubah_posisi: boolean;
      lain_lain: boolean;
      catatan_lain: string;
    };
  };

  risiko_jatuh: {
    a_tidak_seimbang: boolean;
    b_pegangan_penopang: boolean;
    kategori: "tidak_berisiko" | "risiko_rendah" | "risiko_tinggi";
  };

  masalah_keperawatan: string;
  rencana_tindakan_keperawatan: string;

  ttd: {
    tanggal_jam: string;
    nama_perawat: string;
    tanda_tangan: string;
  };
};

type Props = {
  encounterId: string;
  onSave: (data: NursingBPRCData) => Promise<void> | void;
  saving?: boolean;

  /**
   * ✅ NEW:
   * Hasil auto-fill dari voice/transkrip (partial).
   * Form akan merge TANPA menimpa input user yang sudah ada.
   */
  prefill?: Partial<NursingBPRCData> | null;
};

function calcIMT(bbKg: number, tbCm: number) {
  if (!bbKg || !tbCm) return "";
  const m = tbCm / 100;
  if (m <= 0) return "";
  const imt = bbKg / (m * m);
  if (!isFinite(imt)) return "";
  return imt.toFixed(1);
}

function scoreNutrisi(bbTurun: YesNo | "", seleraTurun: YesNo | "") {
  let s = 0;
  if (bbTurun === "ya") s += 1;
  if (seleraTurun === "ya") s += 1;
  return s;
}

function interpretNutrisi(score: number) {
  if (score <= 1) return "Skor 0–1: tidak berisiko malnutrisi";
  if (score === 2) return "Skor 2: berisiko malnutrisi";
  return "Skor 3: malnutrisi";
}

/**
 * ✅ Merge helper:
 * - mempertahankan nilai existing jika sudah "terisi"
 * - hanya isi dari incoming jika existing masih default/kosong
 */
function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  // untuk select tri-state/yesno yang boleh ""
  if (v === "") return true;
  // boolean: false dianggap "punya nilai", jangan dianggap kosong
  // number: 0 juga valid
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

    // kalau existing kosong → pakai incoming
    // kalau existing sudah ada isi → keep existing
    if (isEmptyValue(exVal)) out[key] = incVal;
    else out[key] = exVal;
  }

  return out as T;
}

function defaultNursingForm(): NursingBPRCData {
  return {
    keluhan_utama: "",

    alergi: { ada: false, sebutkan: "" },

    sosial_ekonomi: {
      pendidikan: "",
      pekerjaan: "",
      status: "",
      agama: "",
      bangsa: "",
      perjalanan_luar_negeri_2_minggu: "",
      hambatan_komunikasi: "",
      faktor_tradisi_keyakinan: "",
    },

    psikologi: {
      tenang: false,
      cemas: false,
      takut: false,
      marah: false,
      sedih: false,
      kecenderungan_bunuh_diri: false,
    },

    tanda_vital: {
      frekuensi_nadi: "",
      frekuensi_napas: "",
      tekanan_darah: "",
      suhu: "",
    },

    fungsional: {
      alat_bantu: "",
      prothesa: "",
      cacat_tubuh: "",
      adl: "",
    },

    skrining_nutrisi: {
      bb_turun_6_bulan: "",
      selera_makan_turun: "",
      berat_badan_kg: "",
      tinggi_badan_cm: "",
      imt: "",
      lingkar_kepala_cm: "",
      lingkar_pinggang_cm: "",
    },

    pengkajian_nyeri: {
      skala: "",
      lokasi: "",
      durasi: "",
      frekuensi: "",
      pola: "",
      nyeri_hilang_bila: {
        minum_obat: false,
        mendengar_musik: false,
        istirahat: false,
        berubah_posisi: false,
        lain_lain: false,
        catatan_lain: "",
      },
    },

    risiko_jatuh: {
      a_tidak_seimbang: false,
      b_pegangan_penopang: false,
      kategori: "tidak_berisiko",
    },

    masalah_keperawatan: "",
    rencana_tindakan_keperawatan: "",

    ttd: {
      tanggal_jam: "",
      nama_perawat: "",
      tanda_tangan: "",
    },
  };
}

export default function NursingFormBPRC({ encounterId, onSave, saving, prefill }: Props) {
  const storageKey = useMemo(() => `nursing_bprc_${encounterId}`, [encounterId]);

  const [form, setForm] = useState<NursingBPRCData>(() => defaultNursingForm());

  // load draft from localStorage
  useEffect(() => {
    if (!encounterId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setForm(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [encounterId, storageKey]);

  /**
   * ✅ NEW: merge prefill into form (tanpa overwrite input user)
   * Trigger ketika prefill berubah.
   */
  useEffect(() => {
    if (!prefill) return;
    setForm((prev) => {
      const merged = mergeDeepPreferExisting(prev, prefill);
      return merged;
    });
  }, [prefill]);

  // auto-calc IMT
  useEffect(() => {
    const bb = parseFloat(form.skrining_nutrisi.berat_badan_kg || "0");
    const tb = parseFloat(form.skrining_nutrisi.tinggi_badan_cm || "0");
    const imt = calcIMT(bb, tb);

    // avoid infinite loop (only set if changed)
    if (imt !== form.skrining_nutrisi.imt) {
      setForm((prev) => ({
        ...prev,
        skrining_nutrisi: { ...prev.skrining_nutrisi, imt },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.skrining_nutrisi.berat_badan_kg, form.skrining_nutrisi.tinggi_badan_cm]);

  // auto risk jatuh category
  useEffect(() => {
    const a = form.risiko_jatuh.a_tidak_seimbang;
    const b = form.risiko_jatuh.b_pegangan_penopang;
    const kategori = a && b ? "risiko_tinggi" : a || b ? "risiko_rendah" : "tidak_berisiko";
    if (kategori !== form.risiko_jatuh.kategori) {
      setForm((prev) => ({ ...prev, risiko_jatuh: { ...prev.risiko_jatuh, kategori } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.risiko_jatuh.a_tidak_seimbang, form.risiko_jatuh.b_pegangan_penopang]);

  const nutrisiScore = scoreNutrisi(
    form.skrining_nutrisi.bb_turun_6_bulan,
    form.skrining_nutrisi.selera_makan_turun
  );

  async function handleSave() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // ignore
    }
    await onSave(form);
  }

  function set<K extends keyof NursingBPRCData>(key: K, value: NursingBPRCData[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 className="h1">Pengkajian Keperawatan</h1>

      {/* Keluhan Utama */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Keluhan Utama</div>
        <textarea
          className="input"
          style={{ minHeight: 90 }}
          placeholder="Contoh: nyeri paha kiri menjalar ke kaki kiri, kebas di telapak kaki kiri sejak 1 minggu..."
          value={form.keluhan_utama}
          onChange={(e) => set("keluhan_utama", e.target.value)}
        />
      </section>

      {/* Alergi */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Alergi</div>
        <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label className="p" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.alergi.ada}
              onChange={(e) => setForm((p) => ({ ...p, alergi: { ...p.alergi, ada: e.target.checked } }))}
            />
            Ada alergi
          </label>

          <input
            className="input"
            style={{ minWidth: 280 }}
            disabled={!form.alergi.ada}
            placeholder="Jika ada, sebutkan..."
            value={form.alergi.sebutkan}
            onChange={(e) => setForm((p) => ({ ...p, alergi: { ...p.alergi, sebutkan: e.target.value } }))}
          />
        </div>
      </section>

      {/* Sosial Ekonomi */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Status Sosial Ekonomi</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="input" placeholder="Pendidikan" value={form.sosial_ekonomi.pendidikan}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, pendidikan: e.target.value } }))} />
          <input className="input" placeholder="Pekerjaan" value={form.sosial_ekonomi.pekerjaan}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, pekerjaan: e.target.value } }))} />
          <input className="input" placeholder="Status" value={form.sosial_ekonomi.status}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, status: e.target.value } }))} />
          <input className="input" placeholder="Agama" value={form.sosial_ekonomi.agama}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, agama: e.target.value } }))} />
          <input className="input" placeholder="Bangsa" value={form.sosial_ekonomi.bangsa}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, bangsa: e.target.value } }))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <select className="input" value={form.sosial_ekonomi.perjalanan_luar_negeri_2_minggu}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, perjalanan_luar_negeri_2_minggu: e.target.value as TriState } }))}>
            <option value="">Perjalanan ke luar negeri 2 minggu?</option>
            <option value="ya">Ya</option>
            <option value="tidak">Tidak</option>
          </select>

          <select className="input" value={form.sosial_ekonomi.hambatan_komunikasi}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, hambatan_komunikasi: e.target.value as TriState } }))}>
            <option value="">Hambatan komunikasi?</option>
            <option value="ya">Ada</option>
            <option value="tidak">Tidak ada</option>
          </select>

          <select className="input" value={form.sosial_ekonomi.faktor_tradisi_keyakinan}
            onChange={(e) => setForm((p) => ({ ...p, sosial_ekonomi: { ...p.sosial_ekonomi, faktor_tradisi_keyakinan: e.target.value as TriState } }))}>
            <option value="">Faktor tradisi/keyakinan?</option>
            <option value="ya">Ya</option>
            <option value="tidak">Tidak</option>
          </select>
        </div>
      </section>

      {/* Psikologi */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Status Psikologi</div>
        <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
          {[
            ["tenang", "Tenang"],
            ["cemas", "Cemas"],
            ["takut", "Takut"],
            ["marah", "Marah"],
            ["sedih", "Sedih"],
            ["kecenderungan_bunuh_diri", "Kecenderungan bunuh diri"],
          ].map(([k, label]) => (
            <label key={k} className="p" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={(form.psikologi as any)[k]}
                onChange={(e) => setForm((p) => ({ ...p, psikologi: { ...p.psikologi, [k]: e.target.checked } as any }))}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Tanda Vital */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Tanda Vital</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="input" placeholder="Frekuensi nadi" value={form.tanda_vital.frekuensi_nadi}
            onChange={(e) => setForm((p) => ({ ...p, tanda_vital: { ...p.tanda_vital, frekuensi_nadi: e.target.value } }))} />
          <input className="input" placeholder="Frekuensi napas" value={form.tanda_vital.frekuensi_napas}
            onChange={(e) => setForm((p) => ({ ...p, tanda_vital: { ...p.tanda_vital, frekuensi_napas: e.target.value } }))} />
          <input className="input" placeholder="Tekanan darah" value={form.tanda_vital.tekanan_darah}
            onChange={(e) => setForm((p) => ({ ...p, tanda_vital: { ...p.tanda_vital, tekanan_darah: e.target.value } }))} />
          <input className="input" placeholder="Suhu" value={form.tanda_vital.suhu}
            onChange={(e) => setForm((p) => ({ ...p, tanda_vital: { ...p.tanda_vital, suhu: e.target.value } }))} />
        </div>
      </section>

      {/* Fungsional */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Fungsional</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="input" placeholder="Alat bantu (mis: kursi roda)" value={form.fungsional.alat_bantu}
            onChange={(e) => setForm((p) => ({ ...p, fungsional: { ...p.fungsional, alat_bantu: e.target.value } }))} />
          <input className="input" placeholder="Prothesa" value={form.fungsional.prothesa}
            onChange={(e) => setForm((p) => ({ ...p, fungsional: { ...p.fungsional, prothesa: e.target.value } }))} />
          <input className="input" placeholder="Cacat tubuh" value={form.fungsional.cacat_tubuh}
            onChange={(e) => setForm((p) => ({ ...p, fungsional: { ...p.fungsional, cacat_tubuh: e.target.value } }))} />
          <select className="input" value={form.fungsional.adl}
            onChange={(e) => setForm((p) => ({ ...p, fungsional: { ...p.fungsional, adl: e.target.value as any } }))}>
            <option value="">ADL</option>
            <option value="mandiri">Mandiri</option>
            <option value="dibantu">Dibantu</option>
          </select>
        </div>
      </section>

      {/* Skrining Nutrisi */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Skrining Nutrisi</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                  Indikator penilaian nutrisi
                </th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                  Penilaian
                </th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                  Skor
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  1. BB turun tanpa diinginkan dalam 6 bulan terakhir?
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <select
                    className="input"
                    value={form.skrining_nutrisi.bb_turun_6_bulan}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        skrining_nutrisi: { ...p.skrining_nutrisi, bb_turun_6_bulan: e.target.value as any },
                      }))
                    }
                  >
                    <option value="">Pilih</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {form.skrining_nutrisi.bb_turun_6_bulan === "ya" ? 1 : 0}
                </td>
              </tr>

              <tr>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  2. Mengalami penurunan selera makan?
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <select
                    className="input"
                    value={form.skrining_nutrisi.selera_makan_turun}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        skrining_nutrisi: { ...p.skrining_nutrisi, selera_makan_turun: e.target.value as any },
                      }))
                    }
                  >
                    <option value="">Pilih</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {form.skrining_nutrisi.selera_makan_turun === "ya" ? 1 : 0}
                </td>
              </tr>

              <tr>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  3. Berat badan / Tinggi badan / IMT
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <input
                      className="input"
                      placeholder="BB (kg)"
                      value={form.skrining_nutrisi.berat_badan_kg}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          skrining_nutrisi: { ...p.skrining_nutrisi, berat_badan_kg: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="TB (cm)"
                      value={form.skrining_nutrisi.tinggi_badan_cm}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          skrining_nutrisi: { ...p.skrining_nutrisi, tinggi_badan_cm: e.target.value },
                        }))
                      }
                    />
                    <input className="input" placeholder="IMT" value={form.skrining_nutrisi.imt} disabled />
                  </div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>-</td>
              </tr>

              <tr>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>4. Keterangan</td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {interpretNutrisi(nutrisiScore)}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  Total: {nutrisiScore}
                </td>
              </tr>

              <tr>
                <td style={{ padding: 8 }}>
                  5. Lingkar kepala (cm) khusus anak &lt; 3 bulan / Lingkar pinggang (cm)
                </td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input
                      className="input"
                      placeholder="Lingkar kepala (cm)"
                      value={form.skrining_nutrisi.lingkar_kepala_cm}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          skrining_nutrisi: { ...p.skrining_nutrisi, lingkar_kepala_cm: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="Lingkar pinggang (cm)"
                      value={form.skrining_nutrisi.lingkar_pinggang_cm}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          skrining_nutrisi: { ...p.skrining_nutrisi, lingkar_pinggang_cm: e.target.value },
                        }))
                      }
                    />
                  </div>
                </td>
                <td style={{ padding: 8 }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pengkajian Nyeri */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Pengkajian Nyeri</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="input" placeholder="Skala nyeri (Wong Baker/NRS)"
            value={form.pengkajian_nyeri.skala}
            onChange={(e) => setForm((p) => ({ ...p, pengkajian_nyeri: { ...p.pengkajian_nyeri, skala: e.target.value } }))} />
          <input className="input" placeholder="Lokasi"
            value={form.pengkajian_nyeri.lokasi}
            onChange={(e) => setForm((p) => ({ ...p, pengkajian_nyeri: { ...p.pengkajian_nyeri, lokasi: e.target.value } }))} />
          <input className="input" placeholder="Durasi"
            value={form.pengkajian_nyeri.durasi}
            onChange={(e) => setForm((p) => ({ ...p, pengkajian_nyeri: { ...p.pengkajian_nyeri, durasi: e.target.value } }))} />
          <input className="input" placeholder="Frekuensi"
            value={form.pengkajian_nyeri.frekuensi}
            onChange={(e) => setForm((p) => ({ ...p, pengkajian_nyeri: { ...p.pengkajian_nyeri, frekuensi: e.target.value } }))} />
          <select className="input" value={form.pengkajian_nyeri.pola}
            onChange={(e) => setForm((p) => ({ ...p, pengkajian_nyeri: { ...p.pengkajian_nyeri, pola: e.target.value as any } }))}>
            <option value="">Pola nyeri</option>
            <option value="menetap">Menetap</option>
            <option value="hilang_timbul">Hilang timbul</option>
            <option value="menjalar">Menjalar</option>
          </select>
        </div>

        <div className="p" style={{ marginTop: 10, fontWeight: 700 }}>Nyeri hilang bila</div>
        <div className="row" style={{ gap: 14, flexWrap: "wrap", marginTop: 8 }}>
          {[
            ["minum_obat", "Minum obat"],
            ["mendengar_musik", "Mendengar musik"],
            ["istirahat", "Istirahat"],
            ["berubah_posisi", "Berubah posisi"],
            ["lain_lain", "Lain-lain"],
          ].map(([k, label]) => (
            <label key={k} className="p" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={(form.pengkajian_nyeri.nyeri_hilang_bila as any)[k]}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pengkajian_nyeri: {
                      ...p.pengkajian_nyeri,
                      nyeri_hilang_bila: { ...p.pengkajian_nyeri.nyeri_hilang_bila, [k]: e.target.checked } as any,
                    },
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>

        <input
          className="input"
          style={{ marginTop: 10 }}
          placeholder="Catatan lain-lain (jika perlu)"
          value={form.pengkajian_nyeri.nyeri_hilang_bila.catatan_lain}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              pengkajian_nyeri: {
                ...p.pengkajian_nyeri,
                nyeri_hilang_bila: { ...p.pengkajian_nyeri.nyeri_hilang_bila, catatan_lain: e.target.value },
              },
            }))
          }
        />
      </section>

      {/* Risiko Jatuh */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Risiko Jatuh</div>

        <label className="p" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={form.risiko_jatuh.a_tidak_seimbang}
            onChange={(e) =>
              setForm((p) => ({ ...p, risiko_jatuh: { ...p.risiko_jatuh, a_tidak_seimbang: e.target.checked } }))
            }
          />
          <span>a. Cara berjalan tampak tidak seimbang (sempoyongan/limbung)</span>
        </label>

        <label className="p" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={form.risiko_jatuh.b_pegangan_penopang}
            onChange={(e) =>
              setForm((p) => ({ ...p, risiko_jatuh: { ...p.risiko_jatuh, b_pegangan_penopang: e.target.checked } }))
            }
          />
          <span>b. Memegang pinggiran kursi/meja/benda lain sebagai penopang saat akan duduk</span>
        </label>

        <div className="p" style={{ marginTop: 10 }}>
          Kategori:{" "}
          <span className="kbd">
            {form.risiko_jatuh.kategori === "tidak_berisiko"
              ? "Tidak berisiko"
              : form.risiko_jatuh.kategori === "risiko_rendah"
                ? "Risiko rendah"
                : "Risiko tinggi"}
          </span>
        </div>
      </section>

      {/* Masalah & Rencana */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Masalah Keperawatan</div>
        <textarea
          className="input"
          style={{ minHeight: 80 }}
          placeholder="Tuliskan masalah keperawatan..."
          value={form.masalah_keperawatan}
          onChange={(e) => set("masalah_keperawatan", e.target.value)}
        />

        <div className="p" style={{ fontWeight: 700, marginTop: 12, marginBottom: 8 }}>
          Rencana & Tindakan Keperawatan
        </div>
        <textarea
          className="input"
          style={{ minHeight: 90 }}
          placeholder="Tuliskan rencana dan tindakan..."
          value={form.rencana_tindakan_keperawatan}
          onChange={(e) => set("rencana_tindakan_keperawatan", e.target.value)}
        />
      </section>

      {/* TTD */}
      <section className="card" style={{ padding: 14 }}>
        <div className="p" style={{ fontWeight: 700, marginBottom: 8 }}>Pengesahan</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <input
            className="input"
            placeholder="Tanggal/Jam"
            value={form.ttd.tanggal_jam}
            onChange={(e) => setForm((p) => ({ ...p, ttd: { ...p.ttd, tanggal_jam: e.target.value } }))}
          />
          <input
            className="input"
            placeholder="Nama perawat"
            value={form.ttd.nama_perawat}
            onChange={(e) => setForm((p) => ({ ...p, ttd: { ...p.ttd, nama_perawat: e.target.value } }))}
          />
          <input
            className="input"
            placeholder="Tanda tangan (ketik nama/initial)"
            value={form.ttd.tanda_tangan}
            onChange={(e) => setForm((p) => ({ ...p, ttd: { ...p.ttd, tanda_tangan: e.target.value } }))}
          />
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btnPrimary" onClick={handleSave} disabled={!!saving}>
            {saving ? "Saving..." : "Save Nursing Form"}
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(storageKey, JSON.stringify(form));
                alert("Draft saved to localStorage.");
              } catch {
                alert("Failed saving draft.");
              }
            }}
          >
            Save Draft
          </button>
        </div>
      </section>
    </div>
  );
}
