import React from 'react';
import { Box, Container, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import { Description, Campaign, Notifications, PersonAdd } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Menu from './Menu';

interface MenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Dokumenty',
      description: 'Zarządzaj dokumentami targowymi',
      icon: <Description sx={{ fontSize: 40, color: '#1976d2' }} />,
      color: '#e3f2fd'
    },
    {
      title: 'Materiały marketingowe',
      description: 'Biblioteka zasobów promocyjnych',
      icon: <Campaign sx={{ fontSize: 40, color: '#388e3c' }} />,
      color: '#e8f5e8'
    },
    {
      title: 'Komunikaty',
      description: 'Wiadomości i powiadomienia',
      icon: <Notifications sx={{ fontSize: 40, color: '#f57c00' }} />,
      color: '#fff3e0'
    },
    {
      title: 'Generator zaproszeń',
      description: 'Zarządzaj zaproszeniami dla gości',
      icon: <PersonAdd sx={{ fontSize: 40, color: '#7b1fa2' }} />,
      color: '#f3e5f5'
    }
  ];

  return (
    <Box>
      <Menu onLogout={handleLogout} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Witaj w aplikacji PTAK EXPO
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Portal dla wystawców targowych
          </Typography>
          
          {user?.role && (
            <Chip 
              label={user.role === 'admin' ? 'Administrator' : 'Wystawca'} 
              color={user.role === 'admin' ? 'secondary' : 'primary'}
              variant="outlined"
            />
          )}
          
          {user?.companyName && (
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              {user.companyName}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
          {menuItems.map((item: MenuItem, index: number) => (
            <Box key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ostatnie aktywności
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Brak ostatnich aktywności do wyświetlenia.
          </Typography>
        </Box>

        {user?.role === 'admin' && (
          <Box sx={{ mt: 4 }}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  Panel Administracyjny
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Jako administrator masz dostęp do funkcji zarządzania systemem.
                </Typography>
                <Button variant="contained" color="success" sx={{ mt: 2 }}>
                  Przejdź do panelu administratora
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;