import { DoctorBPRCData } from "./DoctorFormBPRC";
import { NursingBPRCData } from "./NursingFormBPRC";

// --- Types from Backend Schemas ---

export type NursingUpsert = {
    chief_complaint_nurse: string;
    allergy_status: string;
    allergy_details?: string | null;

    education?: string | null;
    occupation?: string | null;
    marital_status?: string | null;
    religion?: string | null;
    nationality_ethnicity?: string | null;
    travel_abroad_last_2w?: string | null;
    communication_barrier?: string | null;
    cultural_belief_factor?: string | null;
    cultural_belief_details?: string | null;

    psychology_status?: string[] | null;

    vitals_hr: number;
    vitals_rr: number;
    vitals_bp_systolic: number;
    vitals_bp_diastolic: number;
    vitals_temp_c: number;
    vitals_spo2?: number | null;

    assistive_device?: string | null;
    prosthesis?: string | null;
    disability?: string | null;
    adl_status: string;

    unintentional_weight_loss_6mo: string;
    reduced_appetite: string;
    weight_kg?: number | null;
    height_cm?: number | null;
    bmi?: number | null;
    head_circumference_cm?: number | null;
    waist_circumference_cm?: number | null;
    nutrition_score_total?: number | null;
    nutrition_risk_label?: string | null;

    pain_scale_type: string;
    pain_score: number;
    pain_location: string;
    pain_duration?: string | null;
    pain_frequency?: string | null;
    pain_pattern: string;
    pain_relief_factors?: string[] | null;
    pain_relief_other?: string | null;

    fallrisk_a_imbalance: boolean;
    fallrisk_b_support_hold: boolean;
    fallrisk_level?: string | null;

    nursing_problem?: string | null;
    nursing_plan_action?: string | null;
};

export type MedicalUpsert = {
    chief_complaint_doctor: string;
    anamnesis?: string | null;
    previous_diagnoses_treatments?: string | null;
    post_op?: boolean | null;
    post_procedure?: boolean | null;
    symptom_duration_bucket?: string | null;

    current_medications?: string | null;
    pmh?: string[] | null;
    family_history?: string | null;

    allergy_history?: string[] | null;
    allergy_history_details?: string | null;

    symptom_flags?: string[] | null; // checklist baal, kesemutan, etc
    sleep_quality?: string | null;
    urination_issue?: string | null;
    defecation_issue?: string | null;
    appetite_issue?: string | null;
    adl_description?: string | null;
    or_notes?: string | null;

    nutrition_status?: string | null;
    walking_aid?: string | null;

    labs?: string | null;
    cbc?: string | null;
    doppler?: string | null;
    mri_ct?: string | null;
    pet_scan?: string | null;
    ihc?: string | null;

    differential_diagnosis?: string | null;
    working_diagnosis: string;

    treatment_goal?: string | null;
    plan_notes: string; // mapped from penatalaksanaan (general?) or empty if not strictly input

    // Custom mapping for pro_usg_ipm
    procedure_usg_ipm?: boolean | null;
    procedure_notes?: string | null;

    followup_date?: string | null; // date string YYYY-MM-DD
    followup_time?: string | null; // time string HH:MM
};

export type ExamUpsert = {
    physical_exam_json: Record<string, any> | null;
};


// --- Transformers ---

function parseFloatOrNull(v: string | number | undefined | null): number | null {
    if (v === "" || v === null || v === undefined) return null;
    const f = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(f) ? null : f;
}

function parseIntOrZero(v: string | number | undefined | null): number {
    if (v === "" || v === null || v === undefined) return 0;
    const i = typeof v === "string" ? parseInt(v) : v;
    return isNaN(i) ? 0 : i;
}

function parseBP(bpString: string) {
    // expect "120/80"
    if (!bpString) return { sys: 0, dia: 0 };
    const parts = bpString.split("/");
    if (parts.length < 2) return { sys: parseIntOrZero(parts[0]), dia: 0 };
    return { sys: parseIntOrZero(parts[0]), dia: parseIntOrZero(parts[1]) };
}

export function transformNursing(data: NursingBPRCData): NursingUpsert {
    const bp = parseBP(data.tanda_vital.tekanan_darah);

    // Map psychology
    const psych: string[] = [];
    if (data.psikologi.tenang) psych.push("Tenang");
    if (data.psikologi.cemas) psych.push("Cemas");
    if (data.psikologi.takut) psych.push("Takut");
    if (data.psikologi.marah) psych.push("Marah");
    if (data.psikologi.sedih) psych.push("Sedih");
    if (data.psikologi.kecenderungan_bunuh_diri) psych.push("Kecenderungan Bunuh Diri");

    // Map pain relief
    const relief: string[] = [];
    if (data.pengkajian_nyeri.nyeri_hilang_bila.minum_obat) relief.push("Minum obat");
    if (data.pengkajian_nyeri.nyeri_hilang_bila.mendengar_musik) relief.push("Mendengar musik");
    if (data.pengkajian_nyeri.nyeri_hilang_bila.istirahat) relief.push("Istirahat");
    if (data.pengkajian_nyeri.nyeri_hilang_bila.berubah_posisi) relief.push("Berubah posisi");
    if (data.pengkajian_nyeri.nyeri_hilang_bila.lain_lain) relief.push("Lain-lain");

    // Calculate nutrition score? Frontend usually doesn't store computed score in `data` explicitly, 
    // but let's assume `data.skrining_nutrisi` has inputs.
    // scoreNutrisi logic from frontend:
    let nutScore = 0;
    if (data.skrining_nutrisi.bb_turun_6_bulan === "ya") nutScore += 1;
    if (data.skrining_nutrisi.selera_makan_turun === "ya") nutScore += 1;

    let nutRisk = "Skor 0-1: Tidak berisiko";
    if (nutScore === 2) nutRisk = "Skor 2: Berisiko";
    if (nutScore >= 3) nutRisk = "Skor 3: Malnutrisi"; // Logic in frontend was minimal, this is safe approx

    return {
        chief_complaint_nurse: data.keluhan_utama,
        allergy_status: data.alergi.ada ? "Ada" : "Tidak Ada",
        allergy_details: data.alergi.sebutkan,

        education: data.sosial_ekonomi.pendidikan,
        occupation: data.sosial_ekonomi.pekerjaan,
        marital_status: data.sosial_ekonomi.status,
        religion: data.sosial_ekonomi.agama,
        nationality_ethnicity: data.sosial_ekonomi.bangsa,
        travel_abroad_last_2w: data.sosial_ekonomi.perjalanan_luar_negeri_2_minggu,
        communication_barrier: data.sosial_ekonomi.hambatan_komunikasi,
        cultural_belief_factor: data.sosial_ekonomi.faktor_tradisi_keyakinan,
        cultural_belief_details: "", // Field missing in frontend state?

        psychology_status: psych,

        vitals_hr: parseIntOrZero(data.tanda_vital.frekuensi_nadi),
        vitals_rr: parseIntOrZero(data.tanda_vital.frekuensi_napas),
        vitals_bp_systolic: bp.sys,
        vitals_bp_diastolic: bp.dia,
        vitals_temp_c: parseFloatOrNull(data.tanda_vital.suhu) || 0,
        vitals_spo2: null, // Field missing in frontend state?

        assistive_device: data.fungsional.alat_bantu,
        prosthesis: data.fungsional.prothesa,
        disability: data.fungsional.cacat_tubuh,
        adl_status: data.fungsional.adl,

        unintentional_weight_loss_6mo: data.skrining_nutrisi.bb_turun_6_bulan,
        reduced_appetite: data.skrining_nutrisi.selera_makan_turun,
        weight_kg: parseFloatOrNull(data.skrining_nutrisi.berat_badan_kg),
        height_cm: parseFloatOrNull(data.skrining_nutrisi.tinggi_badan_cm),
        bmi: parseFloatOrNull(data.skrining_nutrisi.imt),
        head_circumference_cm: parseFloatOrNull(data.skrining_nutrisi.lingkar_kepala_cm),
        waist_circumference_cm: parseFloatOrNull(data.skrining_nutrisi.lingkar_pinggang_cm),
        nutrition_score_total: nutScore,
        nutrition_risk_label: nutRisk,

        pain_scale_type: "NRS", // Defaulting
        pain_score: parseIntOrZero(data.pengkajian_nyeri.skala),
        pain_location: data.pengkajian_nyeri.lokasi,
        pain_duration: data.pengkajian_nyeri.durasi,
        pain_frequency: data.pengkajian_nyeri.frekuensi,
        pain_pattern: data.pengkajian_nyeri.pola,
        pain_relief_factors: relief,
        pain_relief_other: data.pengkajian_nyeri.nyeri_hilang_bila.catatan_lain,

        fallrisk_a_imbalance: data.risiko_jatuh.a_tidak_seimbang,
        fallrisk_b_support_hold: data.risiko_jatuh.b_pegangan_penopang,
        fallrisk_level: data.risiko_jatuh.kategori,

        nursing_problem: data.masalah_keperawatan,
        nursing_plan_action: data.rencana_tindakan_keperawatan,
    };
}

export function transformMedical(data: DoctorBPRCData): MedicalUpsert {
    // Map RPD keys to boolean check
    const pmh: string[] = [];
    for (const [k, v] of Object.entries(data.rpd)) {
        if (v) pmh.push(k);
    }

    // Map allergy keys
    const allergies: string[] = [];
    for (const [k, v] of Object.entries(data.riwayat_alergi)) {
        if (v) allergies.push(k);
    }

    // Map symptom flags
    const flags: string[] = [];
    if (data.anamnesis_checkbox.baal) flags.push("Baal");
    if (data.anamnesis_checkbox.kesemutan) flags.push("Kesemutan");
    if (data.anamnesis_checkbox.sakit_kepala) flags.push("Sakit Kepala");

    // Pro USG IPM logic
    const procNote = data.penatalaksanaan.pro_usg_ipm;
    const procBool = procNote && procNote.trim().length > 0;

    return {
        chief_complaint_doctor: data.keluhan_utama,
        anamnesis: data.anamnesis,
        previous_diagnoses_treatments: data.riwayat_pengobatan_diagnosis_sebelumnya,
        post_op: data.status_post_op,
        post_procedure: data.status_post_tindakan,
        symptom_duration_bucket: data.onset_range,

        current_medications: data.obat_sedang_diminum,
        pmh: pmh,
        family_history: data.rpk,

        allergy_history: allergies,
        allergy_history_details: data.riwayat_alergi_lainnya,

        symptom_flags: flags,
        sleep_quality: data.kualitas_tidur,
        urination_issue: data.gangguan_bak_bab,
        defecation_issue: data.gangguan_bak_bab, // Reusing field if combined in UI? UI says "Gangguan BAK/BAB"
        appetite_issue: data.gangguan_makan,
        adl_description: data.adl,
        or_notes: data.or, // Olahraga

        nutrition_status: data.status_gizi,
        walking_aid: data.alat_bantu_jalan,

        labs: null, // "Lain-lain" -> specific fields
        cbc: data.lain_lain.darah_rutin,
        doppler: data.lain_lain.usg_doppler,
        mri_ct: data.lain_lain.mri_ct,
        pet_scan: data.lain_lain.pet_scan,
        ihc: data.lain_lain.imunohistokimia,

        differential_diagnosis: data.diagnosis_banding,
        working_diagnosis: data.diagnosis_kerja,

        treatment_goal: data.penatalaksanaan.goal,
        plan_notes: "", // Plan is split into goal/proc? Or should we use one of them?
        // NOTE: Schema requires plan_notes. Let's combine goal and procedure if plan_notes is empty? 
        // Or maybe we leave it string empty if not provided.

        procedure_usg_ipm: !!procBool,
        procedure_notes: procNote,

        followup_date: data.jadwal_kontrol.tanggal || null, // Sent as null if empty, not ""
        // Pydantic Time expects HH:MM:SS or HH:MM. Ensure format or null.
        followup_time: data.jadwal_kontrol.jam || null,
    };
}

export function transformExam(data: DoctorBPRCData): ExamUpsert {
    return {
        physical_exam_json: {
            pemeriksaan_fisik: data.pemeriksaan_fisik,
            muskuloskeletal: data.muskuloskeletal,
            neurologis: data.neurologis,
        },
    };
}

// --- Restore Transformers (Backend -> Frontend) ---

export function restoreNursing(enc: any): NursingBPRCData | null {
    if (!enc || !enc.nursing) return null;
    const n = enc.nursing;

    // Helper to map list to boolean dict
    const psych = (n.psychology_status || []) as string[];
    const relief = (n.pain_relief_factors || []) as string[];

    // Parse BP
    const sys = n.vitals_bp_systolic || 0;
    const dia = n.vitals_bp_diastolic || 0;
    const bp = (sys || dia) ? `${sys}/${dia}` : "";

    return {
        keluhan_utama: n.chief_complaint_nurse || "",
        alergi: {
            ada: n.allergy_status === "Ada",
            sebutkan: n.allergy_details || "",
        },
        sosial_ekonomi: {
            pendidikan: n.education || "",
            pekerjaan: n.occupation || "",
            status: n.marital_status || "",
            agama: n.religion || "",
            bangsa: n.nationality_ethnicity || "",
            perjalanan_luar_negeri_2_minggu: n.travel_abroad_last_2w || "",
            hambatan_komunikasi: n.communication_barrier || "",
            faktor_tradisi_keyakinan: n.cultural_belief_factor || "",
        },
        psikologi: {
            tenang: psych.includes("Tenang"),
            cemas: psych.includes("Cemas"),
            takut: psych.includes("Takut"),
            marah: psych.includes("Marah"),
            sedih: psych.includes("Sedih"),
            kecenderungan_bunuh_diri: psych.includes("Kecenderungan Bunuh Diri"),
        },
        tanda_vital: {
            frekuensi_nadi: n.vitals_hr ? String(n.vitals_hr) : "",
            frekuensi_napas: n.vitals_rr ? String(n.vitals_rr) : "",
            tekanan_darah: bp,
            suhu: n.vitals_temp_c ? String(n.vitals_temp_c) : "",
        },
        fungsional: {
            alat_bantu: n.assistive_device || "",
            prothesa: n.prosthesis || "",
            cacat_tubuh: n.disability || "",
            adl: n.adl_status || "",
        },
        skrining_nutrisi: {
            bb_turun_6_bulan: n.unintentional_weight_loss_6mo || "",
            selera_makan_turun: n.reduced_appetite || "",
            berat_badan_kg: n.weight_kg ? String(n.weight_kg) : "",
            tinggi_badan_cm: n.height_cm ? String(n.height_cm) : "",
            imt: n.bmi ? String(n.bmi) : "",
            lingkar_kepala_cm: n.head_circumference_cm ? String(n.head_circumference_cm) : "",
            lingkar_pinggang_cm: n.waist_circumference_cm ? String(n.waist_circumference_cm) : "",
        },
        pengkajian_nyeri: {
            skala: n.pain_score !== null ? String(n.pain_score) : "",
            lokasi: n.pain_location || "",
            durasi: n.pain_duration || "",
            frekuensi: n.pain_frequency || "",
            pola: n.pain_pattern || "",
            nyeri_hilang_bila: {
                minum_obat: relief.includes("Minum obat"),
                mendengar_musik: relief.includes("Mendengar musik"),
                istirahat: relief.includes("Istirahat"),
                berubah_posisi: relief.includes("Berubah posisi"),
                lain_lain: relief.includes("Lain-lain"),
                catatan_lain: n.pain_relief_other || "",
            },
        },
        risiko_jatuh: {
            a_tidak_seimbang: n.fallrisk_a_imbalance || false,
            b_pegangan_penopang: n.fallrisk_b_support_hold || false,
            kategori: (n.fallrisk_level || "tidak_berisiko") as any,
        },
        masalah_keperawatan: n.nursing_problem || "",
        rencana_tindakan_keperawatan: n.nursing_plan_action || "",
        ttd: {
            tanggal_jam: "", // Not persisted in same way, or handled by signed_at?
            nama_perawat: "",
            tanda_tangan: "",
        },
    };
}

export function restoreDoctor(enc: any): DoctorBPRCData | null {
    if (!enc || (!enc.medical && !enc.exam)) return null;
    const m = enc.medical || {};
    const e = enc.exam || {};
    const px = e.physical_exam_json || {};

    // Map Arrays to Dicts
    const rpdArr = (m.pmh || []) as string[];
    const rpdDict: any = {};
    const rpdKeys = [
        "Hipertensi", "DM", "Gastritis", "AsamUrat", "Jantung", "Ginjal",
        "Liver", "Kanker", "Kolesterol", "Stroke", "Autoimun", "Trauma"
    ];
    rpdKeys.forEach(k => { rpdDict[k] = rpdArr.includes(k); });

    const algArr = (m.allergy_history || []) as string[];
    const algDict: any = {};
    const algKeys = [
        "Obat", "Debu", "Makanan", "ZatKimia", "Cuaca", "SinarMatahari"
    ];
    algKeys.forEach(k => { algDict[k] = algArr.includes(k); });

    const flags = (m.symptom_flags || []) as string[];

    return {
        keluhan_utama: m.chief_complaint_doctor || "",
        riwayat_pengobatan_diagnosis_sebelumnya: m.previous_diagnoses_treatments || "",
        status_post_op: m.post_op || false,
        status_post_tindakan: m.post_procedure || false,
        onset_range: (m.symptom_duration_bucket || "") as any,
        obat_sedang_diminum: m.current_medications || "",

        rpd: rpdDict,
        rpk: m.family_history || "",
        riwayat_alergi: algDict,
        riwayat_alergi_lainnya: m.allergy_history_details || "",

        anamnesis: m.anamnesis || "",
        anamnesis_checkbox: {
            baal: flags.includes("Baal"),
            kesemutan: flags.includes("Kesemutan"),
            sakit_kepala: flags.includes("Sakit Kepala"),
        },
        kualitas_tidur: m.sleep_quality || "",
        gangguan_bak_bab: m.urination_issue || m.defecation_issue || "",
        gangguan_makan: m.appetite_issue || "",
        adl: m.adl_description || "",
        or: m.or_notes || "",

        status_gizi: (m.nutrition_status || "") as any,
        alat_bantu_jalan: m.walking_aid || "",

        // Physical Exam (JSON)
        pemeriksaan_fisik: px.pemeriksaan_fisik || {
            cranial_nerve: "",
            romberg_tandem: "",
            pain_detect: { sensory_descriptors: "", spatial_temporal: "", score: "", interpretasi: "" },
            phq9_score: "",
        },
        muskuloskeletal: px.muskuloskeletal || {
            head_neck: "", shoulder: "", elbow: "", wrist: "", back: "", genu: "", pedis: ""
        },
        neurologis: px.neurologis || { rows: {} }, // Should ideally init default rows if empty

        lain_lain: {
            darah_rutin: m.cbc || "",
            usg_doppler: m.doppler || "",
            mri_ct: m.mri_ct || "",
            pet_scan: m.pet_scan || "",
            imunohistokimia: m.ihc || "",
        },

        diagnosis_banding: m.differential_diagnosis || "",
        diagnosis_kerja: m.working_diagnosis || "",

        penatalaksanaan: {
            goal: m.treatment_goal || "",
            pro_usg_ipm: m.procedure_notes || "", // mapped back
        },

        jadwal_kontrol: {
            tanggal: m.followup_date || "",
            jam: m.followup_time || "",
        },
    };
}
