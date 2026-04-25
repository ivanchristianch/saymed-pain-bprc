import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { fetchApi } from '../api';
import AppHeader from '../components/AppHeader';
import PatientTable from '../components/patients/PatientTable';
import AddPatientDialog from '../components/patients/AddPatientDialog';

export default function Patients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/patients');
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handleSave = async (formData: any) => {
    await fetchApi('/patients', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).getTime(),
      }),
    });
    await loadPatients();
  };

  const calculateAge = (timestamp: number): number | string => {
    if (!timestamp) return '-';
    const ageDifMs = Date.now() - timestamp;
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppHeader
        title="SayMed"
        onLogout={handleLogout}
        logoutLabel={t('nav.logout')}
      />

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }} color="text.primary">
            {t('patients.title')}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
            {t('patients.add')}
          </Button>
        </Box>

        <PatientTable
          patients={patients}
          loading={loading}
          onView={(id) => navigate(`/patients/${id}`)}
          calculateAge={calculateAge}
        />
      </Box>

      <AddPatientDialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
