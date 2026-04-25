import { Box, Typography, TextField } from '@mui/material';

interface ATabProps {
  formData: any;
  handleChange: (section: string, field: string, subfield: string | null, value: any) => void;
  t: (key: string) => string;
}

export default function ATab({ formData, handleChange, t }: ATabProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h6" color="primary">Assessment (A)</Typography>
      <TextField
        label={t('a.differentialDiagnosis')} fullWidth multiline rows={4}
        value={formData.a?.differentialDiagnosis || ''}
        onChange={e => handleChange('a', 'differentialDiagnosis', null, e.target.value)}
      />
      <TextField
        label={t('a.workingDiagnosis')} fullWidth multiline rows={4}
        value={formData.a?.workingDiagnosis || ''}
        onChange={e => handleChange('a', 'workingDiagnosis', null, e.target.value)}
      />
    </Box>
  );
}
