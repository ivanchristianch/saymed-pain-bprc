import { Box, Typography, TextField } from '@mui/material';

interface PTabProps {
  formData: any;
  handleChange: (section: string, field: string, subfield: string | null, value: any) => void;
  t: (key: string) => string;
}

export default function PTab({ formData, handleChange, t }: PTabProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h6" color="primary">Plan (P)</Typography>

      <TextField
        label={t('p.treatmentGoal')} fullWidth multiline rows={2}
        value={formData.p?.treatmentGoal || ''}
        onChange={e => handleChange('p', 'treatmentGoal', null, e.target.value)}
      />
      <TextField
        label={t('p.usgIpmPlan')} fullWidth multiline rows={2}
        value={formData.p?.usgIpmPlan || ''}
        onChange={e => handleChange('p', 'usgIpmPlan', null, e.target.value)}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label={t('p.followUpDate')} type="date"
          slotProps={{ inputLabel: { shrink: true } }} fullWidth
          value={formData.p?.followUpDate || ''}
          onChange={e => handleChange('p', 'followUpDate', null, e.target.value)}
        />
        <TextField
          label={t('p.followUpTime')} type="time"
          slotProps={{ inputLabel: { shrink: true } }} fullWidth
          value={formData.p?.followUpTime || ''}
          onChange={e => handleChange('p', 'followUpTime', null, e.target.value)}
        />
      </Box>

      <TextField
        label={t('p.treatmentPlan')} fullWidth multiline rows={4}
        value={formData.p?.treatmentPlan || ''}
        onChange={e => handleChange('p', 'treatmentPlan', null, e.target.value)}
      />
      <TextField
        label={t('p.medications')} fullWidth multiline rows={3}
        value={typeof formData.p?.medications === 'string' ? formData.p?.medications : JSON.stringify(formData.p?.medications || [])}
        onChange={e => handleChange('p', 'medications', null, e.target.value)}
      />
      <TextField
        label={t('p.physiotherapy')} fullWidth multiline rows={2}
        value={formData.p?.physiotherapy || ''}
        onChange={e => handleChange('p', 'physiotherapy', null, e.target.value)}
      />
      <TextField
        label={t('p.lifestyleModification')} fullWidth multiline rows={2}
        value={formData.p?.lifestyleModification || ''}
        onChange={e => handleChange('p', 'lifestyleModification', null, e.target.value)}
      />
      <TextField
        label={t('p.patientEducation')} fullWidth multiline rows={3}
        value={formData.p?.patientEducation || ''}
        onChange={e => handleChange('p', 'patientEducation', null, e.target.value)}
      />
      <TextField
        label={t('p.proceduresPerformed')} fullWidth multiline rows={3}
        value={formData.p?.proceduresPerformed || ''}
        onChange={e => handleChange('p', 'proceduresPerformed', null, e.target.value)}
      />
      <TextField
        label={t('p.monitoringNotes')} fullWidth multiline rows={3}
        value={formData.p?.monitoringNotes || ''}
        onChange={e => handleChange('p', 'monitoringNotes', null, e.target.value)}
      />
    </Box>
  );
}
