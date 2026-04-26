import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchApi } from '../api';
import {
  type Stage,
  type PipelineStatus,
  TERMINAL_STAGES,
  deriveStage,
} from '../components/encounter/types';
import { POLL_INTERVAL_MS } from '../components/encounter/constants';
import ProcessingOverlay from '../components/encounter/ProcessingOverlay';
import AudioSetupPanel from '../components/encounter/AudioSetupPanel';
import SoapLayout from '../components/encounter/SoapLayout';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000/api';

const PROCESSING_STAGES: Stage[] = ['uploading', 'transcribing', 'analyzing'];

export default function EncounterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [encounter, setEncounter] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ s: {}, o: {}, a: {}, p: {} });
  const [tabValue, setTabValue] = useState(0);

  // Audio state
  const [stage, setStage] = useState<Stage>('idle');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [serverAudioUrl, setServerAudioUrl] = useState<string | null>(null);
  const [audioFetchFailed, setAudioFetchFailed] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Timer for processing overlay
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<Stage>('idle');

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ─── Timer helpers ────────────────────────────────────────────────────────
  const startTimer = useCallback((fromSeconds = 0) => {
    setElapsedSeconds(fromSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ─── Polling helpers ──────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  /** Fetch /status and update stage. Stops polling when terminal state is reached. */
  const pollStatus = useCallback(async () => {
    try {
      const ps: PipelineStatus = await fetchApi(`/encounters/${id}/status`);
      const derived = deriveStage(ps);
      if (!derived) return;

      stageRef.current = derived;
      setStage(derived);
      setErrorMsg(ps.error_msg ?? '');

      // If a job is actively pending, keep the timer in sync with server started_at
      // so it survives page refreshes correctly.
      // NOTE: server and client clocks may differ — elapsed is clamped to >= 0.
      if (
        (derived === 'transcribing' || derived === 'analyzing') &&
        ps.started_at
      ) {
        // Clamp to 0 in case of clock skew (client ahead of server)
        const serverElapsed = Math.max(0, Math.floor((Date.now() - ps.started_at) / 1000));
        setElapsedSeconds(prev => {
          if (!timerRef.current || Math.abs(prev - serverElapsed) > 2) {
            if (!timerRef.current) {
              timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
            }
            return serverElapsed;
          }
          return prev;
        });
      }

      if (TERMINAL_STAGES.includes(derived)) {
        stopPolling();
        stopTimer();
        if (derived === 'analyzed') {
          const soapData = await fetchApi(`/encounters/${id}/details`);
          setFormData(soapData);
          try {
            const transcriptData = await fetchApi(`/encounters/${id}/transcript`);
            if (transcriptData?.transcript) setTranscript(transcriptData.transcript);
          } catch {
            // non-fatal
          }
        }
      }
    } catch (err) {
      console.error('[Poll] Status fetch failed:', err);
    }
  }, [id, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStatus();
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
  }, [pollStatus, stopPolling]);

  // ─── Load initial data ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const data = await fetchApi(`/encounters/${id}`);
      setEncounter(data.encounter);

      if (data.soapData) {
        setFormData((prev: any) => ({ ...prev, ...data.soapData }));
      }

      const details = data.details;
      if (details?.audio_file) {
        try {
          const token = localStorage.getItem('access_token') || '';
          const resp = await fetch(`${API_BASE}/encounters/${id}/audio`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const blob = await resp.blob();
            setServerAudioUrl(URL.createObjectURL(blob));
            setAudioFetchFailed(false);
          } else {
            setAudioFetchFailed(true);
          }
        } catch {
          setAudioFetchFailed(true);
        }

        const ps: PipelineStatus = await fetchApi(`/encounters/${id}/status`);
        const derived = deriveStage(ps);
        const initialStage: Stage = derived ?? 'uploaded';

        stageRef.current = initialStage;
        setStage(initialStage);
        setErrorMsg(ps.error_msg ?? '');

        if (initialStage === 'analyzed') {
          const soapData = await fetchApi(`/encounters/${id}/details`);
          setFormData(soapData);
          try {
            const transcriptData = await fetchApi(`/encounters/${id}/transcript`);
            if (transcriptData?.transcript) setTranscript(transcriptData.transcript);
          } catch { /* non-fatal */ }
        } else if (!TERMINAL_STAGES.includes(initialStage) && initialStage !== 'uploaded') {
          if (ps.started_at) {
            // Clamp to 0 in case of clock skew (client ahead of server)
            const serverElapsed = Math.max(0, Math.floor((Date.now() - ps.started_at) / 1000));
            startTimer(serverElapsed);
          } else {
            startTimer(0);
          }
          startPolling();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, startPolling]);

  useEffect(() => {
    loadData();
    return () => {
      stopTimer();
      stopPolling();
    };
  }, [id]);

  // ─── Recording ────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setLocalAudioUrl(url);
        setAudioFile(new File([audioBlob], `recording_enc_${id}.mp3`, { type: 'audio/mp3' }));
        setStage('recorded');
        stageRef.current = 'recorded';
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied', err);
      alert('Akses mikrofon ditolak.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size === 0) {
        setErrorMsg(t('encounter.recording.emptyAudioError'));
        return;
      }
      setAudioFile(file);
      setLocalAudioUrl(URL.createObjectURL(file));
      setStage('recorded');
      stageRef.current = 'recorded';
    }
  };

  // ─── Upload audio ─────────────────────────────────────────────────────────
  const handleUploadAudio = async () => {
    if (!audioFile) return;
    if (audioFile.size === 0) {
      setErrorMsg(t('encounter.recording.emptyAudioError'));
      return;
    }
    setStage('uploading');
    stageRef.current = 'uploading';
    setErrorMsg('');
    startTimer();
    try {
      const fd = new FormData();
      fd.append('audio', audioFile);
      await fetchApi(`/encounters/${id}/upload`, { method: 'POST', body: fd });
      setServerAudioUrl(localAudioUrl);
      setAudioFetchFailed(false);
      setStage('uploaded');
      stageRef.current = 'uploaded';
    } catch (err: any) {
      setErrorMsg(err.message);
      setStage('error_upload');
      stageRef.current = 'error_upload';
    } finally {
      stopTimer();
    }
  };

  // ─── Trigger pipeline ─────────────────────────────────────────────────────
  const handleProcess = async () => {
    setErrorMsg('');
    startTimer();
    try {
      await fetchApi(`/encounters/${id}/process`, { method: 'POST' });
    } catch (err: any) {
      console.warn('[Process] Trigger error (still polling):', err.message);
    }
    startPolling();
  };

  const handleRetry = () => {
    setErrorMsg('');
    setStage('idle');
    stageRef.current = 'idle';
  };

  // ─── SOAP save ────────────────────────────────────────────────────────────
  const handleChange = (section: string, field: string, subfield: string | null, value: any) => {
    setFormData((prev: any) => {
      const newSection = { ...prev[section] };
      if (subfield) {
        newSection[field] = { ...(newSection[field] || {}), [subfield]: value };
      } else {
        newSection[field] = value;
      }
      return { ...prev, [section]: newSection };
    });
  };

  const handleSave = async () => {
    try {
      await fetchApi(`/encounters/${id}/details`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      alert(t('encounter.saved'));
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan');
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const isProcessingOverlay = PROCESSING_STAGES.includes(stage);

  const processingLabel =
    stage === 'uploading'
      ? t('encounter.recording.uploading')
      : stage === 'transcribing'
        ? t('encounter.recording.transcribing')
        : stage === 'analyzing'
          ? t('encounter.recording.analyzing')
          : '';

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading || !encounter) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  // ─── Analyzed: full SOAP layout ───────────────────────────────────────────
  if (stage === 'analyzed') {
    return (
      <SoapLayout
        encounter={encounter}
        serverAudioUrl={serverAudioUrl}
        localAudioUrl={localAudioUrl}
        transcript={transcript}
        tabValue={tabValue}
        onTabChange={(_e, v) => setTabValue(v)}
        onSave={handleSave}
        onBack={() => navigate(`/patients/${encounter.patient_id}`)}
        formData={formData}
        handleChange={handleChange}
        setFormData={setFormData}
      />
    );
  }

  // ─── Setup / processing screen ────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(`/patients/${encounter.patient_id}`)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {encounter.encounter_name || `Kunjungan ${id}`}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
        <Box sx={{ width: '100%', maxWidth: 560 }}>
          {isProcessingOverlay ? (
            <ProcessingOverlay
              processingLabel={processingLabel}
              elapsedSeconds={elapsedSeconds}
            />
          ) : (
            <AudioSetupPanel
              stage={stage}
              recording={recording}
              localAudioUrl={localAudioUrl}
              serverAudioUrl={serverAudioUrl}
              audioFetchFailed={audioFetchFailed}
              errorMsg={errorMsg}
              uploading={stage === 'uploading'}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onFileSelect={handleFileSelect}
              onUpload={handleUploadAudio}
              onProcess={handleProcess}
              onRetry={handleRetry}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
