import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EncounterRepository } from '../repositories/encounter.repository.js';
import { EncounterDetailsRepository } from '../repositories/encounter-details.repository.js';
import { TranscriptRepository } from '../repositories/transcript.repository.js';
import { AnalysisRepository } from '../repositories/analysis.repository.js';
import { acquireLock, releaseLock } from '../redis.js';
import { getLogger } from '../logger.js';
import {
  TRANSCRIPT_STATE,
  ANALYSIS_STATE,
  TRANSCRIPT_TIMEOUT_MS,
  ANALYSIS_TIMEOUT_MS,
} from '../constants.js';

const transcriptsDir = path.resolve(process.cwd(), 'transcripts');
if (!fs.existsSync(transcriptsDir)) fs.mkdirSync(transcriptsDir, { recursive: true });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const PROMPT_TEMPLATE = `Kamu adalah asisten medis yang membantu dokter spesialis nyeri membuat catatan SOAP dari transkrip wawancara klinis.

Berdasarkan transkrip percakapan berikut antara dokter dan pasien, ekstrak informasi medis ke dalam format JSON terstruktur.

PENTING:
- Hanya isi field yang disebutkan dalam transkrip. Jika tidak ada informasi, gunakan null atau string kosong "".
- Untuk field boolean, gunakan true/false.
- onsetRange harus salah satu dari: "1M" | "1M-1B" | "1B-3B" | "3B-1T" | "1T-5T" | "5T-10T" atau "".
- nutritionStatus harus salah satu dari: "poor" | "adequate" | "excess" atau "".
- neurologicalExam: objek { "C1": { "motor": "", "sensory": "" }, ... } untuk level C1-C8, T1-T12, L1-L5, S1-S4, RefleksFisiologis, RefleksPatologis.
- medications: array [{ "name": "...", "dose": "..." }] jika ada, atau [].
- Kembalikan HANYA JSON murni tanpa markdown code block.

Transkrip:
---
{{TRANSCRIPT}}
---

Format JSON:
{
  "s": {
    "chiefComplaint": "",
    "previousTreatmentHistory": "",
    "postOpStatus": false,
    "postProcedureStatus": false,
    "onsetRange": "",
    "currentMedications": "",
    "pastMedicalHistory": { "Hipertensi": false, "DM": false, "Gastritis": false, "AsamUrat": false, "Jantung": false, "Ginjal": false, "Liver": false, "Kanker": false, "Kolesterol": false, "Stroke": false, "Autoimun": false, "Trauma": false },
    "familyHistory": "",
    "allergies": { "Obat": false, "Debu": false, "Makanan": false, "ZatKimia": false, "Cuaca": false, "SinarMatahari": false },
    "otherAllergies": "",
    "anamnesis": "",
    "anamnesisNumbness": false,
    "anamnesisTingling": false,
    "anamnesisHeadache": false,
    "sleepQuality": "",
    "urinaryBowelDisturbance": "",
    "eatingDisturbance": "",
    "adl": "",
    "physicalActivity": "",
    "nutritionStatus": "",
    "mobilityAid": ""
  },
  "o": {
    "cranialNerve": "",
    "rombergTandem": "",
    "painDetectSensory": "",
    "painDetectSpatial": "",
    "painDetectScore": "",
    "painDetectInterpretation": "",
    "phq9Score": "",
    "mskHeadNeck": "",
    "mskShoulder": "",
    "mskElbow": "",
    "mskWrist": "",
    "mskBack": "",
    "mskKnee": "",
    "mskFoot": "",
    "neurologicalExam": {
        "C1": { "motor": "", "sensory": "" }, "C2": { "motor": "", "sensory": "" },
        "RefleksFisiologis": { "motor": "", "sensory": "" },
        "RefleksPatologis": { "motor": "", "sensory": "" }
    },
    "routineBloodTest": "",
    "usgDoppler": "",
    "mriCt": "",
    "petScan": "",
    "immunohistochemistry": ""
  },
  "a": {
    "differentialDiagnosis": "",
    "workingDiagnosis": ""
  },
  "p": {
    "treatmentGoal": "",
    "usgIpmPlan": "",
    "followUpDate": "",
    "followUpTime": "",
    "treatmentPlan": "",
    "medications": [],
    "physiotherapy": "",
    "lifestyleModification": "",
    "patientEducation": "",
    "proceduresPerformed": "",
    "monitoringNotes": ""
  }
}`;

export interface PipelineStatus {
  stage: 'transcript' | 'analysis' | null;
  status: 'pending' | 'success' | 'error' | null;
  error_msg: string | null;
  started_at: number | null;
}

export class ProcessService {
  constructor(
    private encounterRepo: EncounterRepository,
    private detailsRepo: EncounterDetailsRepository,
    private transcriptRepo: TranscriptRepository,
    private analysisRepo: AnalysisRepository,
  ) {}

  async trigger(encounterId: number, businessId: number): Promise<void> {
    const encounter = await this.encounterRepo.findByIdAndBusiness(encounterId, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const details = await this.detailsRepo.findByEncounter(encounterId);
    if (!details?.audio_file) {
      throw { status: 400, message: 'No audio file found for this encounter. Please upload audio first.' };
    }

    const acquired = await acquireLock(encounterId);
    if (!acquired) {
      getLogger().info({ msg: 'Lock already held, rejecting duplicate trigger', encounterId });
      return;
    }

    this.runPipelineBackground(encounterId, details.id)
      .catch((err) => getLogger().error({ msg: 'Pipeline unhandled error', encounterId, err: err?.message ?? String(err) }))
      .finally(() => releaseLock(encounterId));
  }

  async getStatus(encounterId: number, businessId: number): Promise<PipelineStatus> {
    const now = Date.now();

    const encounter = await this.encounterRepo.findByIdAndBusiness(encounterId, businessId);
    if (!encounter) throw { status: 404, message: 'Encounter not found' };

    const detailsRecord = await this.detailsRepo.findByEncounter(encounterId);
    if (!detailsRecord?.audio_file) {
      return { stage: null, status: null, error_msg: null, started_at: null };
    }

    const latestTranscript = await this.transcriptRepo.findLatestForAudio(
      detailsRecord.id,
      detailsRecord.audio_file,
    );

    if (!latestTranscript) {
      return { stage: null, status: null, error_msg: null, started_at: null };
    }

    let transcriptStatus: 'pending' | 'success' | 'error';
    let transcriptErrorMsg: string | null = null;

    if (latestTranscript.state === TRANSCRIPT_STATE.SUCCESS) {
      transcriptStatus = 'success';
    } else if (
      latestTranscript.state === TRANSCRIPT_STATE.PENDING &&
      now - Number(latestTranscript.started_at ?? 0) < TRANSCRIPT_TIMEOUT_MS
    ) {
      transcriptStatus = 'pending';
    } else if (latestTranscript.state === TRANSCRIPT_STATE.ERROR) {
      transcriptStatus = 'error';
      transcriptErrorMsg = latestTranscript.error_msg ?? 'Unknown transcript error';
    } else {
      transcriptStatus = 'error';
      transcriptErrorMsg = `Transcript job timed out after ${TRANSCRIPT_TIMEOUT_MS / 60000}min`;
    }

    if (transcriptStatus !== 'success') {
      return {
        stage: 'transcript',
        status: transcriptStatus,
        error_msg: transcriptErrorMsg,
        started_at: Number(latestTranscript.started_at ?? 0) || null,
      };
    }

    const latestAnalysis = await this.analysisRepo.findLatestForTranscript(
      detailsRecord.id,
      latestTranscript.transcript_id,
    );

    if (!latestAnalysis) {
      return { stage: 'analysis', status: null, error_msg: null, started_at: null };
    }

    let analysisStatus: 'pending' | 'success' | 'error';
    let analysisErrorMsg: string | null = null;

    if (latestAnalysis.state === ANALYSIS_STATE.SUCCESS) {
      analysisStatus = 'success';
    } else if (
      latestAnalysis.state === ANALYSIS_STATE.PENDING &&
      now - Number(latestAnalysis.started_at ?? 0) < ANALYSIS_TIMEOUT_MS
    ) {
      analysisStatus = 'pending';
    } else if (latestAnalysis.state === ANALYSIS_STATE.ERROR) {
      analysisStatus = 'error';
      analysisErrorMsg = latestAnalysis.error_msg ?? 'Unknown analysis error';
    } else {
      analysisStatus = 'error';
      analysisErrorMsg = `Analysis job timed out after ${ANALYSIS_TIMEOUT_MS / 60000}min`;
    }

    return {
      stage: 'analysis',
      status: analysisStatus,
      error_msg: analysisErrorMsg,
      started_at: Number(latestAnalysis.started_at ?? 0) || null,
    };
  }

  // ─── Private pipeline helpers ─────────────────────────────────────────────

  private async runPipelineBackground(
    encounterId: number,
    encounterDetailsId: number,
  ): Promise<void> {
    const now = () => Date.now();

    // PHASE A: TRANSCRIPT
    const details = await this.detailsRepo.findByEncounter(encounterId);
    if (!details) {
      getLogger().error({ msg: 'encounter_details not found, aborting pipeline', encounterId });
      return;
    }

    const currentAudioFile = details.audio_file;
    if (!currentAudioFile) {
      getLogger().error({ msg: 'No audio_file on encounter_details, aborting pipeline', encounterDetailsId });
      return;
    }

    const latestTranscript = await this.transcriptRepo.findLatestForAudio(
      encounterDetailsId,
      currentAudioFile,
    );

    let transcriptId: number;

    const transcriptIsGenuinelyPending =
      latestTranscript?.state === TRANSCRIPT_STATE.PENDING &&
      now() - Number(latestTranscript.started_at ?? 0) < TRANSCRIPT_TIMEOUT_MS;

    if (latestTranscript?.state === TRANSCRIPT_STATE.SUCCESS && latestTranscript.transcript_path) {
      getLogger().info({ msg: 'Transcript already succeeded, skipping', transcriptId: latestTranscript.transcript_id });
      transcriptId = latestTranscript.transcript_id;
    } else if (transcriptIsGenuinelyPending) {
      getLogger().info({ msg: 'Transcript already pending within timeout, bailing out' });
      return;
    } else {
      const inserted = await this.transcriptRepo.createJob(encounterDetailsId, currentAudioFile);
      transcriptId = inserted.transcript_id;
      getLogger().info({ msg: 'Transcript job created', transcriptId });

      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), TRANSCRIPT_TIMEOUT_MS);
        const transcriptText = await this.callWhisperX(currentAudioFile, ac.signal);
        clearTimeout(timer);

        const transcriptFilename = `${path.basename(currentAudioFile)}.txt`;
        const absTranscriptPath = path.resolve(transcriptsDir, transcriptFilename);
        fs.writeFileSync(absTranscriptPath, transcriptText, 'utf-8');

        await this.transcriptRepo.markSuccess(transcriptId, absTranscriptPath);
        getLogger().info({ msg: 'Transcript succeeded', transcriptId, path: absTranscriptPath });
      } catch (err: any) {
        const errorMsg =
          err.name === 'AbortError'
            ? `WhisperX timeout after ${TRANSCRIPT_TIMEOUT_MS / 60000}min`
            : `WhisperX error: ${err.message ?? String(err)}`;

        getLogger().error({ msg: 'Transcript failed', transcriptId, errorMsg });
        await this.transcriptRepo.markError(transcriptId, errorMsg);
        return;
      }
    }

    // PHASE B: ANALYSIS
    const latestAnalysis = await this.analysisRepo.findLatestForTranscript(
      encounterDetailsId,
      transcriptId,
    );

    const analysisIsGenuinelyPending =
      latestAnalysis?.state === ANALYSIS_STATE.PENDING &&
      now() - Number(latestAnalysis.started_at ?? 0) < ANALYSIS_TIMEOUT_MS;

    if (latestAnalysis?.state === ANALYSIS_STATE.SUCCESS && latestAnalysis.result) {
      getLogger().info({ msg: 'Analysis already succeeded, skipping', analysisId: latestAnalysis.analysis_id });
      return;
    } else if (analysisIsGenuinelyPending) {
      getLogger().info({ msg: 'Analysis already pending within timeout, bailing out' });
      return;
    } else {
      const inserted = await this.analysisRepo.createJob(encounterDetailsId, transcriptId);
      const analysisId = inserted.analysis_id;
      getLogger().info({ msg: 'Analysis job created', analysisId });

      const transcriptRow = await this.transcriptRepo.findById(transcriptId);
      if (!transcriptRow?.transcript_path) {
        await this.analysisRepo.markError(analysisId, 'Transcript path missing');
        return;
      }

      const transcriptText = fs.readFileSync(transcriptRow.transcript_path, 'utf-8');

      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), ANALYSIS_TIMEOUT_MS);
        const soapResult = await this.callGemini(transcriptText, ac.signal);
        clearTimeout(timer);

        await this.analysisRepo.markSuccess(analysisId, JSON.stringify(soapResult));
        getLogger().info({ msg: 'Analysis succeeded', analysisId });
      } catch (err: any) {
        const errorMsg =
          err.name === 'AbortError'
            ? `Gemini timeout after ${ANALYSIS_TIMEOUT_MS / 60000}min`
            : `Gemini error: ${err.message ?? String(err)}`;

        getLogger().error({ msg: 'Analysis failed', analysisId, errorMsg });
        await this.analysisRepo.markError(analysisId, errorMsg);
      }
    }
  }

  private async callWhisperX(audioFilePath: string, signal: AbortSignal): Promise<string> {
    const whisperxUrl = (process.env.WHISPERX_API_URL || '') + '/transcribe';
    const fileStream = fs.createReadStream(audioFilePath);
    const form = new FormData();
    form.append('file', fileStream, path.basename(audioFilePath));

    getLogger().info({ msg: 'Sending audio to WhisperX', audioFilePath, whisperxUrl });
    const response = await fetch(whisperxUrl, { method: 'POST', body: form as any, signal });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`WhisperX API HTTP ${response.status}: ${errText}`);
    }

    return response.text();
  }

  private async callGemini(transcriptText: string, signal: AbortSignal): Promise<any> {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    const prompt = PROMPT_TEMPLATE.replace('{{TRANSCRIPT}}', transcriptText);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

    getLogger().info({ msg: 'Sending transcript to Gemini for analysis' });

    const genPromise = model.generateContent(prompt);
    const abortPromise = new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

    const genResult = await Promise.race([genPromise, abortPromise]);
    let text = genResult.response.text();
    getLogger().info({ msg: 'Gemini raw response received', responseLength: text.length });

    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error(
        `Gemini JSON parse failed: ${(e as Error).message}. Raw: ${text.substring(0, 200)}`,
      );
    }

    if (!parsed.s || !parsed.o || !parsed.a || !parsed.p) {
      throw new Error('Gemini response missing required SOAP keys (s/o/a/p)');
    }

    return parsed;
  }
}
