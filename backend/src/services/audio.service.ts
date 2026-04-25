import fs from 'fs';
import path from 'path';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';
import { EncounterDetails } from '../types/db.js';
import { getLogger } from '../logger.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function tryDeleteFile(filePath: string | null | undefined): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    getLogger().warn({ msg: 'Could not delete file', filePath, err: String(e) });
  }
}

export class AudioService {
  constructor(
    private encounterRepo: EncounterRepository,
    private detailsRepo: EncounterDetailsRepository,
    private transcriptRepo: TranscriptRepository,
  ) {}

  async uploadAudio(encounterId: number, businessId: number, file: Express.Multer.File): Promise<void> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(encounterId, businessId);
    if (!encounter) {
      // Clean up uploaded temp file before throwing
      tryDeleteFile(file.path);
      throw { status: 404, message: 'Encounter not found' };
    }

    // Preserve original file extension so WhisperX can identify the format
    const originalExt = path.extname(file.originalname || '').toLowerCase() || '.wav';
    const absAudioPath = path.resolve(file.path) + originalExt;
    fs.renameSync(file.path, absAudioPath);

    const detailsRecord = await this.detailsRepo.findByEncounter(encounterId);

    if (!detailsRecord) {
      await this.detailsRepo.create({
        encounter_id: encounterId,
        audio_file: absAudioPath,
        details: '{}',
      });
    } else {
      // Remove old audio file before replacing
      tryDeleteFile(detailsRecord.audio_file);

      // Strip the _analyzed flag so SOAP tabs hide
      let details: Record<string, any> = {};
      try { details = JSON.parse(detailsRecord.details); } catch { /* ignore */ }
      delete details._analyzed;

      await this.detailsRepo.update(detailsRecord.id, {
        audio_file: absAudioPath,
        details: JSON.stringify(details),
      });
    }
  }

  async getAudioPath(encounterId: number, businessId: number): Promise<string> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(encounterId, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const detailsRecord = await this.detailsRepo.findByEncounter(encounterId);
    if (!detailsRecord?.audio_file) throw { status: 404, message: 'No audio file found' };

    const absPath = path.isAbsolute(detailsRecord.audio_file)
      ? detailsRecord.audio_file
      : path.resolve(process.cwd(), detailsRecord.audio_file);

    if (!fs.existsSync(absPath)) throw { status: 404, message: 'Audio file not found on disk' };

    return absPath;
  }

  async getTranscript(encounterId: number, businessId: number): Promise<string> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(encounterId, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const detailsRecord = await this.detailsRepo.findByEncounter(encounterId);
    if (!detailsRecord?.audio_file) throw { status: 404, message: 'No audio file found for this encounter' };

    const latestTranscript = await this.transcriptRepo.findLatestSuccessForAudio(
      detailsRecord.id,
      detailsRecord.audio_file,
    );

    if (!latestTranscript?.transcript_path) {
      throw { status: 404, message: 'No transcript found for this encounter' };
    }

    const absPath = path.isAbsolute(latestTranscript.transcript_path)
      ? latestTranscript.transcript_path
      : path.resolve(process.cwd(), latestTranscript.transcript_path);

    if (!fs.existsSync(absPath)) throw { status: 404, message: 'Transcript file not found on disk' };

    return fs.readFileSync(absPath, 'utf-8');
  }
}
