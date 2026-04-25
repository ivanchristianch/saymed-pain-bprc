import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';
import { AnalysisRepository } from '../repositories/analysis.repository.js';
import { Encounter, EncounterDetails } from '../types/db.js';
import { TRANSCRIPT_STATE, ANALYSIS_STATE } from '../constants.js';

export class EncounterService {
  constructor(
    private encounterRepo: EncounterRepository,
    private detailsRepo: EncounterDetailsRepository,
    private transcriptRepo: TranscriptRepository,
    private analysisRepo: AnalysisRepository,
  ) {}

  async getEncounter(
    id: number,
    businessId: number,
  ): Promise<{ encounter: Encounter; details: EncounterDetails | undefined; soapData: any }> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(id, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const details = await this.detailsRepo.findByEncounterNotDeleted(id);

    const soapData = await this.resolveSoapData(details);

    return { encounter, details, soapData };
  }

  async updateEncounter(id: number, businessId: number, encounterName: string): Promise<Encounter | undefined> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(id, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    return this.encounterRepo.update(id, { encounter_name: encounterName });
  }

  async getDetails(id: number, businessId: number): Promise<any> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(id, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const detailsRecord = await this.detailsRepo.findByEncounter(id);
    if (!detailsRecord) return {};

    const parsedDetails = this.parseJson(detailsRecord.details);
    if (this.hasSoapKeys(parsedDetails)) return parsedDetails;

    if (detailsRecord.audio_file) {
      const analysisResult = await this.getLatestAnalysisResult(detailsRecord);
      if (analysisResult) return analysisResult;
    }

    return parsedDetails;
  }

  async saveDetails(id: number, businessId: number, newData: any): Promise<EncounterDetails> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(id, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const now = Date.now();
    const detailsRecord = await this.detailsRepo.findByEncounter(id);

    if (!detailsRecord) {
      return this.detailsRepo.create({
        encounter_id: id,
        audio_file: null,
        details: JSON.stringify(newData),
      });
    }

    const existingDetails = this.parseJson(detailsRecord.details);
    const mergedDetails = { ...existingDetails, ...newData };

    const updated = await this.detailsRepo.update(detailsRecord.id, {
      details: JSON.stringify(mergedDetails),
    });
    if (!updated) throw { status: 500, message: 'Failed to update details' };
    return updated;
  }

  private async resolveSoapData(details: EncounterDetails | undefined): Promise<any> {
    if (!details) return null;

    const parsedDetails = this.parseJson(details.details);
    if (this.hasSoapKeys(parsedDetails)) return parsedDetails;

    if (details.audio_file) {
      return this.getLatestAnalysisResult(details);
    }

    return null;
  }

  private async getLatestAnalysisResult(details: EncounterDetails): Promise<any> {
    const latestTranscript = await this.transcriptRepo.findLatestSuccessForAudio(
      details.id,
      details.audio_file!,
    );
    if (!latestTranscript) return null;

    const latestAnalysis = await this.analysisRepo.findLatestSuccessForTranscript(
      details.id,
      latestTranscript.transcript_id,
    );
    if (!latestAnalysis?.result) return null;

    return this.parseJson(latestAnalysis.result);
  }

  private parseJson(value: string | object): any {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return value;
  }

  private hasSoapKeys(obj: any): boolean {
    return (
      obj?.s !== undefined ||
      obj?.o !== undefined ||
      obj?.a !== undefined ||
      obj?.p !== undefined
    );
  }
}
