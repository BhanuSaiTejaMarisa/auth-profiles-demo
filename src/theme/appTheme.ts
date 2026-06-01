import { createTheme } from '@mui/material'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f5bd8',
      dark: '#0a47aa',
    },
    background: {
      default: '#eef2f7',
      paper: '#ffffff',
    },
    divider: '#d6deea',
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: 'Segoe UI, Tahoma, Arial, sans-serif',
    h4: {
      fontSize: '1.4rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '0.95rem',
      fontWeight: 700,
    },
    body2: {
      fontSize: '0.78rem',
    },
    caption: {
      fontSize: '0.72rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e3e9f3',
          padding: '8px 10px',
        },
        head: {
          backgroundColor: '#f7f9fc',
          color: '#425066',
          fontSize: '0.72rem',
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})
