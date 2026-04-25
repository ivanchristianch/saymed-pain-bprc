import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ProcessService } from '../services/process.service.js';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';
import { AnalysisRepository } from '../repositories/analysis.repository.js';

const router = Router();
router.use(authMiddleware);

const processService = new ProcessService(
  new EncounterRepository(),
  new EncounterDetailsRepository(),
  new TranscriptRepository(),
  new AnalysisRepository(),
);

router.post('/:id/process', async (req: AuthRequest, res: Response) => {
  try {
    await processService.trigger(parseInt(String(req.params.id)), req.user!.business_id);
    res.status(202).json({ status: 'accepted' });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await processService.getStatus(parseInt(String(req.params.id)), req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

export default router;
