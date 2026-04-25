import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';

interface PatientTableProps {
  patients: any[];
  loading: boolean;
  onView: (id: number) => void;
  calculateAge: (ts: number) => number | string;
}

export default function PatientTable({ patients, loading, onView, calculateAge }: PatientTableProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table>
        <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
          <TableRow>
            <TableCell>{t('patients.id')}</TableCell>
            <TableCell>{t('patients.name')}</TableCell>
            <TableCell>{t('patients.rm')}</TableCell>
            <TableCell>{t('patients.age')}</TableCell>
            <TableCell>{t('patients.marital')}</TableCell>
            <TableCell>{t('patients.blood')}</TableCell>
            <TableCell align="right">{t('patients.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map(row => (
            <TableRow key={row.id} hover>
              <TableCell>{row.id}</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
              <TableCell>{row.medical_record_number}</TableCell>
              <TableCell>{calculateAge(row.date_of_birth)} thn</TableCell>
              <TableCell>{t(`patients.${row.marital_status}`)}</TableCell>
              <TableCell>{row.blood_group}</TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => onView(row.id)}>
                  <VisibilityIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">Belum ada data pasien.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
