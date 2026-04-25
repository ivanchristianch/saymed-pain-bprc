// ─── Pipeline ────────────────────────────────────────────────────────────────
export const POLL_INTERVAL_MS = 5000;

// ─── Neurological exam levels ─────────────────────────────────────────────────
export const NEUROLOGICAL_LEVELS = [
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1', 'S2', 'S3', 'S4',
  'RefleksFisiologis', 'RefleksPatologis',
] as const;

// ─── SOAP field options ───────────────────────────────────────────────────────
export const ONSET_RANGE_OPTIONS = ['1M', '1M-1B', '1B-3B', '3B-1T', '1T-5T', '5T-10T'] as const;

export const PAST_MEDICAL_HISTORY_ITEMS = [
  'Hipertensi', 'DM', 'Gastritis', 'AsamUrat', 'Jantung', 'Ginjal',
  'Liver', 'Kanker', 'Kolesterol', 'Stroke', 'Autoimun', 'Trauma',
] as const;

export const ALLERGY_ITEMS = [
  'Obat', 'Debu', 'Makanan', 'ZatKimia', 'Cuaca', 'SinarMatahari',
] as const;

export const NUTRITION_STATUS_OPTIONS = ['poor', 'adequate', 'excess'] as const;

// ─── Patient form options ─────────────────────────────────────────────────────
export const BLOOD_GROUP_OPTIONS = ['A', 'B', 'AB', 'O'] as const;

export const MARITAL_STATUS_OPTIONS = ['single', 'married', 'divorced', 'widowed'] as const;
