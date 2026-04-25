import { Box, Typography, TextField, Grid, Paper } from '@mui/material';
import { NEUROLOGICAL_LEVELS } from '../constants';

interface OTabProps {
  formData: any;
  handleChange: (section: string, field: string, subfield: string | null, value: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  t: (key: string) => string;
}

export default function OTab({ formData, handleChange, setFormData, t }: OTabProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h6" color="primary">Objective (O)</Typography>

      <TextField
        label={t('o.cranialNerve')} fullWidth
        value={formData.o?.cranialNerve || ''}
        onChange={e => handleChange('o', 'cranialNerve', null, e.target.value)}
      />
      <TextField
        label={t('o.rombergTandem')} fullWidth
        value={formData.o?.rombergTandem || ''}
        onChange={e => handleChange('o', 'rombergTandem', null, e.target.value)}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={t('o.painDetectSensory')} fullWidth value={formData.o?.painDetectSensory || ''} onChange={e => handleChange('o', 'painDetectSensory', null, e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={t('o.painDetectSpatial')} fullWidth value={formData.o?.painDetectSpatial || ''} onChange={e => handleChange('o', 'painDetectSpatial', null, e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={t('o.painDetectScore')} fullWidth value={formData.o?.painDetectScore || ''} onChange={e => handleChange('o', 'painDetectScore', null, e.target.value)} />
        </Grid>
      </Grid>

      <TextField
        label={t('o.painDetectInterpretation')} fullWidth
        value={formData.o?.painDetectInterpretation || ''}
        onChange={e => handleChange('o', 'painDetectInterpretation', null, e.target.value)}
      />
      <TextField
        label={t('o.phq9Score')} fullWidth
        value={formData.o?.phq9Score || ''}
        onChange={e => handleChange('o', 'phq9Score', null, e.target.value)}
      />

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Muskuloskeletal</Typography>
      <TextField label={t('o.mskHeadNeck')} fullWidth multiline value={formData.o?.mskHeadNeck || ''} onChange={e => handleChange('o', 'mskHeadNeck', null, e.target.value)} />
      <TextField label={t('o.mskShoulder')} fullWidth multiline value={formData.o?.mskShoulder || ''} onChange={e => handleChange('o', 'mskShoulder', null, e.target.value)} />
      <TextField label={t('o.mskElbow')} fullWidth multiline value={formData.o?.mskElbow || ''} onChange={e => handleChange('o', 'mskElbow', null, e.target.value)} />
      <TextField label={t('o.mskWrist')} fullWidth multiline value={formData.o?.mskWrist || ''} onChange={e => handleChange('o', 'mskWrist', null, e.target.value)} />
      <TextField label={t('o.mskBack')} fullWidth multiline value={formData.o?.mskBack || ''} onChange={e => handleChange('o', 'mskBack', null, e.target.value)} />
      <TextField label={t('o.mskKnee')} fullWidth multiline value={formData.o?.mskKnee || ''} onChange={e => handleChange('o', 'mskKnee', null, e.target.value)} />
      <TextField label={t('o.mskFoot')} fullWidth multiline value={formData.o?.mskFoot || ''} onChange={e => handleChange('o', 'mskFoot', null, e.target.value)} />

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>{t('o.neurologicalExam')}</Typography>
      <Grid container spacing={1}>
        {NEUROLOGICAL_LEVELS.map(level => {
          const motor = formData.o?.neurologicalExam?.[level]?.motor || '';
          const sensory = formData.o?.neurologicalExam?.[level]?.sensory || '';
          return (
            <Grid key={level} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>{level}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" label="Motor" fullWidth value={motor} onChange={e => {
                    setFormData((prev: any) => ({
                      ...prev,
                      o: {
                        ...prev.o,
                        neurologicalExam: {
                          ...(prev.o?.neurologicalExam || {}),
                          [level]: { ...(prev.o?.neurologicalExam?.[level] || {}), motor: e.target.value },
                        },
                      },
                    }));
                  }} />
                  <TextField size="small" label="Sensory" fullWidth value={sensory} onChange={e => {
                    setFormData((prev: any) => ({
                      ...prev,
                      o: {
                        ...prev.o,
                        neurologicalExam: {
                          ...(prev.o?.neurologicalExam || {}),
                          [level]: { ...(prev.o?.neurologicalExam?.[level] || {}), sensory: e.target.value },
                        },
                      },
                    }));
                  }} />
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Lab & Radiologi</Typography>
      <TextField label={t('o.routineBloodTest')} fullWidth multiline value={formData.o?.routineBloodTest || ''} onChange={e => handleChange('o', 'routineBloodTest', null, e.target.value)} />
      <TextField label={t('o.usgDoppler')} fullWidth multiline value={formData.o?.usgDoppler || ''} onChange={e => handleChange('o', 'usgDoppler', null, e.target.value)} />
      <TextField label={t('o.mriCt')} fullWidth multiline value={formData.o?.mriCt || ''} onChange={e => handleChange('o', 'mriCt', null, e.target.value)} />
      <TextField label={t('o.petScan')} fullWidth multiline value={formData.o?.petScan || ''} onChange={e => handleChange('o', 'petScan', null, e.target.value)} />
      <TextField label={t('o.immunohistochemistry')} fullWidth multiline value={formData.o?.immunohistochemistry || ''} onChange={e => handleChange('o', 'immunohistochemistry', null, e.target.value)} />
    </Box>
  );
}
