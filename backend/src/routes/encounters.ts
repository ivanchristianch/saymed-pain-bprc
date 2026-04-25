import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { EncounterService } from '../services/encounter.service.js';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';
import { AnalysisRepository } from '../repositories/analysis.repository.js';

const router = Router();
router.use(authMiddleware);

const encounterService = new EncounterService(
  new EncounterRepository(),
  new EncounterDetailsRepository(),
  new TranscriptRepository(),
  new AnalysisRepository(),
);

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await encounterService.getEncounter(parseInt(String(req.params.id)), req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await encounterService.updateEncounter(parseInt(String(req.params.id)), req.user!.business_id, req.body.encounter_name));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.get('/:id/details', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await encounterService.getDetails(parseInt(String(req.params.id)), req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.put('/:id/details', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await encounterService.saveDetails(parseInt(String(req.params.id)), req.user!.business_id, req.body));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

export default router;
