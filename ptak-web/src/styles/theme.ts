import { createTheme } from '@mui/material/styles';
declare module '@mui/material/styles' {
  interface TypeText {
    info: string;
  }
}
const theme = createTheme({
  palette: {
    primary: {
      main: '#5a6ec8',
    },
    secondary: { main: '#2E2E38' },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(111, 111, 111, 1)',
      info: 'rgb(111, 135, 246)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          padding: 8,
          paddingLeft: 18,
          paddingRight: 18,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '1rem',
        },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            backgroundColor: 'rgba(255,255,255,0.65)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      ],
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 56,
          height: 56,
        },
      },
    },
  },
});

export default theme;
