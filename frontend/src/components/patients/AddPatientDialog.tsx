import { useState } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BLOOD_GROUP_OPTIONS, MARITAL_STATUS_OPTIONS } from '../encounter/constants';

interface PatientFormData {
  name: string;
  date_of_birth: string;
  medical_record_number: string;
  marital_status: string;
  blood_group: string;
  address: string;
}

const INITIAL_FORM: PatientFormData = {
  name: '',
  date_of_birth: '',
  medical_record_number: '',
  marital_status: 'single',
  blood_group: 'O',
  address: '',
};

interface AddPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PatientFormData) => Promise<void>;
}

export default function AddPatientDialog({ open, onClose, onSave }: AddPatientDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PatientFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setFormData(INITIAL_FORM);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('patients.add')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            label={t('patients.name')} fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            type="date" label="Tanggal Lahir" fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={formData.date_of_birth}
            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
          />
          <TextField
            label={t('patients.rm')} fullWidth
            value={formData.medical_record_number}
            onChange={e => setFormData({ ...formData, medical_record_number: e.target.value })}
          />

          <TextField
            select label={t('patients.marital')} fullWidth
            value={formData.marital_status}
            onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
          >
            {MARITAL_STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>{t(`patients.${opt}`)}</MenuItem>
            ))}
          </TextField>

          <TextField
            select label={t('patients.blood')} fullWidth
            value={formData.blood_group}
            onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
          >
            {BLOOD_GROUP_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Alamat" multiline rows={3} fullWidth
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Batal</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
