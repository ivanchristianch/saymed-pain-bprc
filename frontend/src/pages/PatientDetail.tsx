import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, CircularProgress } from '@mui/material';
import { fetchApi } from '../api';
import AppHeader from '../components/AppHeader';
import PatientProfileCard from '../components/patientDetail/PatientProfileCard';
import EncounterList from '../components/patientDetail/EncounterList';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [patient, setPatient] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const pData = await fetchApi(`/patients/${id}`);
      setPatient(pData);
      const eData = await fetchApi(`/patients/${id}/encounters`);
      setEncounters(eData);
    } catch (err) {
      console.error(err);
      navigate('/patients');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (data: any) => {
    await fetchApi(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await loadData();
  };

  const handleDelete = async () => {
    if (!window.confirm(t('patientDetail.confirmDelete'))) return;
    try {
      await fetchApi(`/patients/${id}`, { method: 'DELETE' });
      navigate('/patients');
    } catch (err) {
      console.error(err);
    }
  };

  const createEncounter = async () => {
    const defaultName = `Kunjungan ${new Date().toLocaleDateString('id-ID')}`;
    const name = window.prompt(t('patientDetail.encounterName'), defaultName);
    if (name === null) return;
    try {
      const newEnc = await fetchApi(`/patients/${id}/encounters`, {
        method: 'POST',
        body: JSON.stringify({ encounter_name: name }),
      });
      navigate(`/encounters/${newEnc.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (!patient) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppHeader
        title={patient.name}
        onBack={() => navigate('/patients')}
      />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <PatientProfileCard
              patient={patient}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <EncounterList
              encounters={encounters}
              onCreate={createEncounter}
              onOpen={(encId) => navigate(`/encounters/${encId}`)}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
