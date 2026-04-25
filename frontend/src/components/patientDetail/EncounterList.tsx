import {
  Box, Button, Typography, Paper, List, ListItem, ListItemText,
  ListItemSecondaryAction, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';

interface EncounterListProps {
  encounters: any[];
  onCreate: () => void;
  onOpen: (id: number) => void;
}

export default function EncounterList({ encounters, onCreate, onOpen }: EncounterListProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{t('patientDetail.encounters')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          {t('patientDetail.createEncounter')}
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <List>
          {encounters.map((enc, idx) => (
            <div key={enc.id}>
              <ListItem>
                <ListItemText
                  primary={enc.encounter_name || `Kunjungan ${enc.id}`}
                  secondary={new Date(Number(enc.created_at)).toLocaleString('id-ID')}
                  slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<VisibilityIcon />}
                    onClick={() => onOpen(enc.id)}
                  >
                    Buka
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              {idx < encounters.length - 1 && <Divider />}
            </div>
          ))}
          {encounters.length === 0 && (
            <ListItem>
              <ListItemText primary="Pasien ini belum memiliki kunjungan." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}
