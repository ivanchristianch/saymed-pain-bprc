import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import patientsRoutes from './routes/patients.js';
import encountersRoutes from './routes/encounters.js';
import audioRoutes from './routes/audio.js';
import processRoutes from './routes/process.js';
import { baseLogger } from './logger.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.js';
import { RecoveryService } from './services/recovery.service.js';
import { ProcessService } from './services/process.service.js';
import { EncounterRepository } from './repositories/encounter.repository.js';
import { EncounterDetailsRepository } from './repositories/encounter-details.repository.js';
import { TranscriptRepository } from './repositories/transcript.repository.js';
import { AnalysisRepository } from './repositories/analysis.repository.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(requestLoggerMiddleware);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/encounters', encountersRoutes);
app.use('/api/encounters', audioRoutes);   // /:id/upload, /:id/audio, /:id/transcript
app.use('/api/encounters', processRoutes); // /:id/process (trigger), /:id/status (poll)

// ─── Start server ─────────────────────────────────────────────────────────────
// app.listen is called FIRST so the server accepts HTTP traffic immediately.
// Recovery runs in the background and does not delay startup.
app.listen(port, () => {
  baseLogger.info({ msg: `Server listening on port ${port}`, port });
});

// ─── Boot-time pipeline recovery (background) ────────────────────────────────
// Reads the Redis active-pipeline set (SMEMBERS) and re-triggers any encounter
// whose pipeline was left in-flight when the previous process was killed.
// Fire-and-forget — does not delay server startup.
const recoveryService = new RecoveryService(
  new ProcessService(
    new EncounterRepository(),
    new EncounterDetailsRepository(),
    new TranscriptRepository(),
    new AnalysisRepository(),
  ),
);

recoveryService.recoverPendingJobs()
  .catch((err: any) => {
    baseLogger.error({ msg: '[Recovery] Boot-time recovery failed', err: err?.message ?? String(err) });
  });

