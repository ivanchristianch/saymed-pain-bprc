import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { useTranslation } from 'react-i18next';
import type { Stage } from './types';

interface AudioSetupPanelProps {
  stage: Stage;
  recording: boolean;
  localAudioUrl: string | null;
  serverAudioUrl: string | null;
  audioFetchFailed: boolean;
  errorMsg: string;
  uploading: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onProcess: () => void;
  onRetry: () => void;
}

export default function AudioSetupPanel({
  stage,
  recording,
  localAudioUrl,
  serverAudioUrl,
  audioFetchFailed,
  errorMsg,
  uploading,
  onStartRecording,
  onStopRecording,
  onFileSelect,
  onUpload,
  onProcess,
  onRetry,
}: AudioSetupPanelProps) {
  const { t } = useTranslation();

  const RecordOrStopButton = () =>
    !recording ? (
      <Button fullWidth variant="outlined" color="error" size="large" startIcon={<MicIcon />} onClick={onStartRecording}>
        {t('encounter.recording.start')}
      </Button>
    ) : (
      <Button fullWidth variant="outlined" color="error" size="large" startIcon={<StopIcon />} onClick={onStopRecording}>
        {t('encounter.recording.stop')}
      </Button>
    );

  const SelectFileButton = ({ disabled }: { disabled?: boolean }) => (
    <Button fullWidth component="label" variant="outlined" size="large" startIcon={<FileUploadIcon />} disabled={disabled}>
      {t('encounter.recording.selectAudio')}
      <input type="file" hidden accept="audio/*" onChange={onFileSelect} />
    </Button>
  );

  const UploadButton = () => (
    <Button
      fullWidth variant="contained" color="primary" size="large"
      startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
      disabled={uploading}
      onClick={onUpload}
    >
      {uploading ? t('encounter.recording.uploading') : t('encounter.recording.uploadAudio')}
    </Button>
  );

  const ProcessButton = () => (
    <Button
      fullWidth variant="contained" color="secondary" size="large"
      startIcon={<AutoAwesomeIcon />}
      onClick={onProcess}
    >
      {t('encounter.recording.transcribeAndAnalyze')}
    </Button>
  );

  const RetryButton = () => (
    <Button
      fullWidth variant="outlined" size="large"
      startIcon={<RefreshIcon />}
      onClick={onRetry}
    >
      {t('encounter.recording.retry')}
    </Button>
  );

  const IdleActions = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <RecordOrStopButton />
      <SelectFileButton disabled={recording} />
    </Box>
  );

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (stage === 'idle') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <GraphicEqIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>Audio & AI</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('encounter.soap.noAudioHint')}
          </Typography>
        </Box>
        <IdleActions />
      </Paper>
    );
  }

  // ── RECORDED ──────────────────────────────────────────────────────────────
  if (stage === 'recorded') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t('encounter.soap.pendingUpload')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('encounter.soap.pendingUploadHint')}</Typography>
        </Box>
        {localAudioUrl && (
          <Box sx={{ mb: 3 }}>
            <audio src={localAudioUrl} controls style={{ width: '100%' }} />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <UploadButton />
          <SelectFileButton />
          <RecordOrStopButton />
        </Box>
      </Paper>
    );
  }

  // ── UPLOAD ERROR ──────────────────────────────────────────────────────────
  if (stage === 'error_upload') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="error">Gagal Mengunggah</Typography>
          {errorMsg && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{errorMsg}</Alert>}
        </Box>
        {localAudioUrl && <audio src={localAudioUrl} controls style={{ width: '100%', marginBottom: 16 }} />}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <UploadButton />
          <SelectFileButton />
        </Box>
      </Paper>
    );
  }

  // ── UPLOADED ──────────────────────────────────────────────────────────────
  if (stage === 'uploaded') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t('encounter.soap.pendingTranscript')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('encounter.soap.pendingTranscriptHint')}</Typography>
        </Box>
        {(localAudioUrl || serverAudioUrl) ? (
          <Box sx={{ mb: 3 }}>
            <audio src={localAudioUrl || serverAudioUrl || undefined} controls style={{ width: '100%' }} />
          </Box>
        ) : audioFetchFailed ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Audio tersimpan di server. Pilih ulang file audio untuk memutar atau melanjutkan proses.
          </Alert>
        ) : null}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ProcessButton />
          <SelectFileButton />
        </Box>
      </Paper>
    );
  }

  // ── TRANSCRIPT ERROR ──────────────────────────────────────────────────────
  if (stage === 'transcript_error') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="error">Transkripsi Gagal</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('encounter.recording.retryTranscribe')}
          </Typography>
          {errorMsg && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{errorMsg}</Alert>}
        </Box>
        {(localAudioUrl || serverAudioUrl) && (
          <audio src={localAudioUrl || serverAudioUrl || undefined} controls style={{ width: '100%', marginBottom: 16 }} />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ProcessButton />
          <RetryButton />
        </Box>
      </Paper>
    );
  }

  // ── ANALYSIS ERROR ────────────────────────────────────────────────────────
  if (stage === 'analysis_error') {
    return (
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }} color="error">Analisis Gagal</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('encounter.recording.retryAnalyze')}
          </Typography>
          {errorMsg && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{errorMsg}</Alert>}
        </Box>
        {(localAudioUrl || serverAudioUrl) && (
          <audio src={localAudioUrl || serverAudioUrl || undefined} controls style={{ width: '100%', marginBottom: 16 }} />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ProcessButton />
          <RetryButton />
        </Box>
      </Paper>
    );
  }

  return null;
}
