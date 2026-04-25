import { AppBar, Toolbar, IconButton, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  onLogout?: () => void;
  logoutLabel?: string;
  actions?: React.ReactNode;
}

export default function AppHeader({ title, onBack, onLogout, logoutLabel, actions }: AppHeaderProps) {
  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}
    >
      <Toolbar>
        {onBack && (
          <IconButton edge="start" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
          {title}
        </Typography>
        {actions}
        {onLogout && (
          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            {logoutLabel}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
