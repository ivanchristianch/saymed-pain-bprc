import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { PatientService } from '../services/patient.service.js';
import { PatientRepository } from '../repositories/patient.repository.js';
import { EncounterRepository } from '../repositories/encounter.repository.js';

const router = Router();
router.use(authMiddleware);

const patientService = new PatientService(new PatientRepository(), new EncounterRepository());

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.listPatients(req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.createPatient(req.body, req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Failed to create patient' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.getPatient(parseInt(String(req.params.id)), req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.updatePatient(parseInt(String(req.params.id)), req.user!.business_id, req.body));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Failed to update patient' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await patientService.deletePatient(parseInt(String(req.params.id)), req.user!.business_id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Failed to delete patient' });
  }
});

router.get('/:id/encounters', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.listEncounters(parseInt(String(req.params.id)), req.user!.business_id));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
  }
});

router.post('/:id/encounters', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await patientService.createEncounter(parseInt(String(req.params.id)), req.user!.business_id, req.body.encounter_name));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message ?? 'Failed to create encounter' });
  }
});

export default router;
