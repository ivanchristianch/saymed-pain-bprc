import { Box, Button, Typography, Paper, Tabs, Tab, AppBar, Toolbar, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import STab from './soap/STab';
import OTab from './soap/OTab';
import ATab from './soap/ATab';
import PTab from './soap/PTab';

interface SoapLayoutProps {
  encounter: any;
  serverAudioUrl: string | null;
  localAudioUrl: string | null;
  transcript: string;
  tabValue: number;
  onTabChange: (_e: any, v: number) => void;
  onSave: () => void;
  onBack: () => void;
  formData: any;
  handleChange: (section: string, field: string, subfield: string | null, value: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function SoapLayout({
  encounter,
  serverAudioUrl,
  localAudioUrl,
  transcript,
  tabValue,
  onTabChange,
  onSave,
  onBack,
  formData,
  handleChange,
  setFormData,
}: SoapLayoutProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <Toolbar>
          <IconButton edge="start" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {encounter.encounter_name || `Kunjungan ${encounter.id}`}
          </Typography>
          <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={onSave}>
            {t('encounter.save')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* LEFT PANEL: Audio player */}
        <Box sx={{
          width: { xs: '100%', md: 300 },
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Audio</Typography>
          {(serverAudioUrl || localAudioUrl) && (
            <audio src={serverAudioUrl || localAudioUrl || undefined} controls style={{ width: '100%' }} />
          )}
          {transcript && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                {t('encounter.recording.transcriptAvailable')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* RIGHT PANEL: SOAP Tabs */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, bgcolor: 'white' }}>
            <Tabs
              value={tabValue}
              onChange={onTabChange}
              textColor="primary"
              indicatorColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={t('encounter.tabs.s')} />
              <Tab label={t('encounter.tabs.o')} />
              <Tab label={t('encounter.tabs.a')} />
              <Tab label={t('encounter.tabs.p')} />
              {transcript && <Tab label={t('encounter.tabs.transcript')} />}
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowY: 'auto' }}>
            {tabValue === 0 && <STab formData={formData} handleChange={handleChange} t={t} />}
            {tabValue === 1 && <OTab formData={formData} handleChange={handleChange} setFormData={setFormData} t={t} />}
            {tabValue === 2 && <ATab formData={formData} handleChange={handleChange} t={t} />}
            {tabValue === 3 && <PTab formData={formData} handleChange={handleChange} t={t} />}
            {tabValue === 4 && transcript && (
              <Paper variant="outlined" sx={{ p: 3, whiteSpace: 'pre-wrap', lineHeight: 1.7, bgcolor: '#f8fafc' }}>
                <Typography variant="body2">{transcript}</Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
