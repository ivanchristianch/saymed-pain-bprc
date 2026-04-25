import { useEffect, useState } from 'react';
import {
  Box, Button, Paper, TextField, MenuItem, Divider, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { BLOOD_GROUP_OPTIONS, MARITAL_STATUS_OPTIONS } from '../encounter/constants';

interface PatientProfileCardProps {
  patient: any;
  onUpdate: (data: any) => Promise<void>;
  onDelete: () => void;
}

export default function PatientProfileCard({ patient, onUpdate, onDelete }: PatientProfileCardProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      ...patient,
      date_of_birth: patient.date_of_birth
        ? new Date(Number(patient.date_of_birth)).toISOString().split('T')[0]
        : '',
    });
  }, [patient]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await onUpdate({
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).getTime(),
      });
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Profil Pasien</Box>
        {!editMode ? (
          <Button size="small" onClick={() => setEditMode(true)}>{t('patientDetail.edit')}</Button>
        ) : (
          <Box>
            <Button size="small" onClick={() => setEditMode(false)} sx={{ mr: 1 }} disabled={saving}>
              Batal
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleUpdate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              Simpan
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <TextField
          label={t('patients.name')} fullWidth size="small" disabled={!editMode}
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          type="date" label="Tanggal Lahir" fullWidth size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={!editMode}
          value={formData.date_of_birth || ''}
          onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
        />
        <TextField
          label={t('patients.rm')} fullWidth size="small" disabled={!editMode}
          value={formData.medical_record_number || ''}
          onChange={e => setFormData({ ...formData, medical_record_number: e.target.value })}
        />

        <TextField
          select label={t('patients.marital')} fullWidth size="small" disabled={!editMode}
          value={formData.marital_status || ''}
          onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
        >
          {MARITAL_STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>{t(`patients.${opt}`)}</MenuItem>
          ))}
        </TextField>

        <TextField
          select label={t('patients.blood')} fullWidth size="small" disabled={!editMode}
          value={formData.blood_group || ''}
          onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
        >
          {BLOOD_GROUP_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="Alamat" multiline rows={3} fullWidth size="small" disabled={!editMode}
          value={formData.address || ''}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
        />
      </Box>

      <Divider sx={{ my: 3 }} />
      <Button
        fullWidth color="error" variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={onDelete}
      >
        {t('patientDetail.delete')}
      </Button>
    </Paper>
  );
}
