import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AudioService } from '../services/audio.service.js';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
const upload = multer({ dest: uploadsDir });

const router = Router();
router.use(authMiddleware);

const audioService = new AudioService(
  new EncounterRepository(),
  new EncounterDetailsRepository(),
  new TranscriptRepository(),
);

router.post('/:id/upload', upload.single('audio'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }
  try {
    await audioService.uploadAudio(parseInt(String(req.params.id)), req.user!.business_id, req.file);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.get('/:id/audio', async (req: AuthRequest, res: Response) => {
  try {
    const absPath = await audioService.getAudioPath(parseInt(String(req.params.id)), req.user!.business_id);
    res.sendFile(absPath, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.get('/:id/transcript', async (req: AuthRequest, res: Response) => {
  try {
    const text = await audioService.getTranscript(parseInt(String(req.params.id)), req.user!.business_id);
    res.json({ transcript: text });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

export default router;
