import {
  Box, Typography, TextField, Grid, Checkbox, FormControlLabel,
  FormGroup, FormControl, FormLabel, RadioGroup, Radio,
} from '@mui/material';
import {
  ONSET_RANGE_OPTIONS,
  PAST_MEDICAL_HISTORY_ITEMS,
  ALLERGY_ITEMS,
  NUTRITION_STATUS_OPTIONS,
} from '../constants';

interface STabProps {
  formData: any;
  handleChange: (section: string, field: string, subfield: string | null, value: any) => void;
  t: (key: string) => string;
}

export default function STab({ formData, handleChange, t }: STabProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h6" color="primary">Subjective (S)</Typography>

      <TextField
        label={t('s.chiefComplaint')} fullWidth multiline rows={3}
        value={formData.s?.chiefComplaint || ''}
        onChange={e => handleChange('s', 'chiefComplaint', null, e.target.value)}
      />
      <TextField
        label={t('s.previousTreatmentHistory')} fullWidth multiline rows={2}
        value={formData.s?.previousTreatmentHistory || ''}
        onChange={e => handleChange('s', 'previousTreatmentHistory', null, e.target.value)}
      />

      <FormGroup row>
        <FormControlLabel
          control={<Checkbox checked={!!formData.s?.postOpStatus} onChange={e => handleChange('s', 'postOpStatus', null, e.target.checked)} />}
          label={t('s.postOpStatus')}
        />
        <FormControlLabel
          control={<Checkbox checked={!!formData.s?.postProcedureStatus} onChange={e => handleChange('s', 'postProcedureStatus', null, e.target.checked)} />}
          label={t('s.postProcedureStatus')}
        />
      </FormGroup>

      <FormControl component="fieldset">
        <FormLabel component="legend">{t('s.onsetRange')}</FormLabel>
        <RadioGroup row value={formData.s?.onsetRange || ''} onChange={e => handleChange('s', 'onsetRange', null, e.target.value)}>
          {ONSET_RANGE_OPTIONS.map(val => (
            <FormControlLabel key={val} value={val} control={<Radio />} label={val} />
          ))}
        </RadioGroup>
      </FormControl>

      <TextField
        label={t('s.currentMedications')} fullWidth multiline rows={2}
        value={formData.s?.currentMedications || ''}
        onChange={e => handleChange('s', 'currentMedications', null, e.target.value)}
      />

      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{t('s.pastMedicalHistory')}</Typography>
      <Grid container>
        {PAST_MEDICAL_HISTORY_ITEMS.map(item => (
          <Grid key={item} size={{ xs: 6, sm: 4, md: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={!!formData.s?.pastMedicalHistory?.[item]} onChange={e => handleChange('s', 'pastMedicalHistory', item, e.target.checked)} />}
              label={item}
            />
          </Grid>
        ))}
      </Grid>

      <TextField
        label={t('s.familyHistory')} fullWidth multiline rows={2}
        value={formData.s?.familyHistory || ''}
        onChange={e => handleChange('s', 'familyHistory', null, e.target.value)}
      />

      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{t('s.allergies')}</Typography>
      <Grid container>
        {ALLERGY_ITEMS.map(item => (
          <Grid key={item} size={{ xs: 6, sm: 4, md: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={!!formData.s?.allergies?.[item]} onChange={e => handleChange('s', 'allergies', item, e.target.checked)} />}
              label={item}
            />
          </Grid>
        ))}
      </Grid>
      <TextField
        label={t('s.otherAllergies')} fullWidth
        value={formData.s?.otherAllergies || ''}
        onChange={e => handleChange('s', 'otherAllergies', null, e.target.value)}
      />

      <TextField
        label={t('s.anamnesis')} fullWidth multiline rows={4}
        value={formData.s?.anamnesis || ''}
        onChange={e => handleChange('s', 'anamnesis', null, e.target.value)}
      />

      <FormGroup row>
        <FormControlLabel
          control={<Checkbox checked={!!formData.s?.anamnesisNumbness} onChange={e => handleChange('s', 'anamnesisNumbness', null, e.target.checked)} />}
          label={t('s.anamnesisNumbness')}
        />
        <FormControlLabel
          control={<Checkbox checked={!!formData.s?.anamnesisTingling} onChange={e => handleChange('s', 'anamnesisTingling', null, e.target.checked)} />}
          label={t('s.anamnesisTingling')}
        />
        <FormControlLabel
          control={<Checkbox checked={!!formData.s?.anamnesisHeadache} onChange={e => handleChange('s', 'anamnesisHeadache', null, e.target.checked)} />}
          label={t('s.anamnesisHeadache')}
        />
      </FormGroup>

      <TextField
        label={t('s.sleepQuality')} fullWidth
        value={formData.s?.sleepQuality || ''}
        onChange={e => handleChange('s', 'sleepQuality', null, e.target.value)}
      />
      <TextField
        label={t('s.urinaryBowelDisturbance')} fullWidth
        value={formData.s?.urinaryBowelDisturbance || ''}
        onChange={e => handleChange('s', 'urinaryBowelDisturbance', null, e.target.value)}
      />
      <TextField
        label={t('s.eatingDisturbance')} fullWidth
        value={formData.s?.eatingDisturbance || ''}
        onChange={e => handleChange('s', 'eatingDisturbance', null, e.target.value)}
      />
      <TextField
        label={t('s.adl')} fullWidth
        value={formData.s?.adl || ''}
        onChange={e => handleChange('s', 'adl', null, e.target.value)}
      />
      <TextField
        label={t('s.physicalActivity')} fullWidth
        value={formData.s?.physicalActivity || ''}
        onChange={e => handleChange('s', 'physicalActivity', null, e.target.value)}
      />

      <FormControl component="fieldset">
        <FormLabel component="legend">{t('s.nutritionStatus')}</FormLabel>
        <RadioGroup row value={formData.s?.nutritionStatus || ''} onChange={e => handleChange('s', 'nutritionStatus', null, e.target.value)}>
          {NUTRITION_STATUS_OPTIONS.map(val => (
            <FormControlLabel key={val} value={val} control={<Radio />} label={t(val) || val} />
          ))}
        </RadioGroup>
      </FormControl>

      <TextField
        label={t('s.mobilityAid')} fullWidth
        value={formData.s?.mobilityAid || ''}
        onChange={e => handleChange('s', 'mobilityAid', null, e.target.value)}
      />
    </Box>
  );
}
