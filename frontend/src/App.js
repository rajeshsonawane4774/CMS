import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#234567' }, // Deep blue
    secondary: { main: '#e3e8ee' }, // Soft gray accent
    background: { default: '#f6f8fa', paper: '#fff' },
    text: { primary: '#1a1a1a', secondary: '#5a5a5a' },
    divider: '#e3e8ee',
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h6: { fontWeight: 700, letterSpacing: 0.5 },
    h4: { fontWeight: 700, letterSpacing: 0.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          boxShadow: 'none',
          background: '#234567',
          color: '#fff',
          transition: 'background 0.2s',
          '&:hover': {
            background: '#1a2a3a',
            boxShadow: '0 2px 8px rgba(35, 69, 103, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(35, 69, 103, 0.07)',
          background: '#fff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          background: '#f6f8fa',
          borderRadius: 10,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          background: '#f6f8fa',
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#fff',
          color: '#234567',
          boxShadow: '0 6px 24px 0 rgba(35, 69, 103, 0.15)', // Stronger shadow
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLogin = (newToken, userRole) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', userRole);
    setToken(newToken);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/dashboard"
            element={
              token ? <Dashboard token={token} role={role} onLogout={handleLogout} /> : <Navigate to="/login" />
            }
          />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;