// Pipeline job states stored in transcript_tab.state and analysis_tab.state
export const TRANSCRIPT_STATE = {
  PENDING: 0,
  SUCCESS: 1,
  ERROR: 2,
} as const;

export const ANALYSIS_STATE = {
  PENDING: 0,
  SUCCESS: 1,
  ERROR: 2,
} as const;

// Timeout durations (ms)
export const TRANSCRIPT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const ANALYSIS_TIMEOUT_MS   = 1 * 60 * 1000; // 1 minute

// Redis lock TTL covers worst-case full pipeline duration plus a safety buffer
export const PIPELINE_LOCK_TTL_MS =
  TRANSCRIPT_TIMEOUT_MS + ANALYSIS_TIMEOUT_MS + 30_000;
