// ─── Stage machine ────────────────────────────────────────────────────────────
// idle              → no audio at all
// recorded          → audio captured/selected locally, not yet uploaded
// uploading         → currently POSTing to /upload
// uploaded          → audio on server, pipeline not yet started
// transcribing      → pipeline running: transcript phase pending
// transcript_error  → transcript phase failed
// analyzing         → transcript succeeded, analysis phase pending/not-yet-started
// analysis_error    → analysis phase failed
// analyzed          → both transcript and analysis succeeded
// error_upload      → upload failed
export type Stage =
  | 'idle'
  | 'recorded'
  | 'uploading'
  | 'uploaded'
  | 'transcribing'
  | 'transcript_error'
  | 'analyzing'
  | 'analysis_error'
  | 'analyzed'
  | 'error_upload';

// Terminal stages where polling should stop
export const TERMINAL_STAGES: Stage[] = ['analyzed', 'transcript_error', 'analysis_error'];

// Status response from GET /encounters/:id/status
// NOTE: started_at is a Unix ms timestamp from the server clock.
// If the client and server clocks differ, elapsed time calculations may be off.
export interface PipelineStatus {
  stage: 'transcript' | 'analysis' | null;
  status: 'pending' | 'success' | 'error' | null;
  error_msg: string | null;
  started_at: number | null; // unix ms when the current job row was created (server clock)
}

/** Derive our UI Stage from the server's PipelineStatus response. */
export function deriveStage(ps: PipelineStatus): Stage | null {
  if (ps.stage === null) return 'uploaded'; // audio exists, no pipeline started yet
  if (ps.stage === 'transcript') {
    if (ps.status === 'pending') return 'transcribing';
    if (ps.status === 'error') return 'transcript_error';
  }
  if (ps.stage === 'analysis') {
    if (ps.status === 'success') return 'analyzed';
    if (ps.status === 'pending' || ps.status === null) return 'analyzing';
    if (ps.status === 'error') return 'analysis_error';
  }
  return null;
}
