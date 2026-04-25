import { Typography, Paper, CircularProgress, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProcessingOverlayProps {
  processingLabel: string;
  elapsedSeconds: number;
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function ProcessingOverlay({ processingLabel, elapsedSeconds }: ProcessingOverlayProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, textAlign: 'center' }}>
      <CircularProgress size={64} thickness={3} sx={{ mb: 3 }} />
      <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
        {processingLabel}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('encounter.recording.instructions')}
      </Typography>
      <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />
      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
        {t('encounter.recording.elapsed')}: {formatElapsed(elapsedSeconds)}
      </Typography>
    </Paper>
  );
}
