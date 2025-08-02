import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  AccountCircle
} from '@mui/icons-material';
import axios from 'axios';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8080/api/login', { 
        username, 
        password 
      });
      onLogin(response.data.token, response.data.role);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-wrapper" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, sm: 2 } }}>
      <Fade in timeout={800}>
        <Card className="login-card" sx={{ width: '100%', maxWidth: 400, borderRadius: 3, boxShadow: 3, mx: { xs: 1, sm: 0 } }}>
          <CardContent>
            <Box className="login-header" sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" className="login-title" sx={{ fontWeight: 600, color: 'primary.main', mb: 1, fontSize: { xs: 24, sm: 32 } }}>
                Welcome
              </Typography>
              <Typography variant="subtitle1" className="login-subtitle" sx={{ color: 'text.secondary', fontSize: { xs: 14, sm: 16 } }}>
                Sign in to Customer Manager System
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} className="login-form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person className="input-icon" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="input-icon" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {error && (
                <Typography className="error-message" sx={{ color: 'error.main', textAlign: 'center', mt: 1 }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="login-button"
                disabled={loading}
                sx={{ height: 48, borderRadius: 2, fontSize: 16, fontWeight: 500, mt: 1 }}
              >
                {loading ? (
                  <CircularProgress size={24} className="button-progress" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}

export default Login;