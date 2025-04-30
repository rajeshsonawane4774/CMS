import React, { useState } from 'react';
import { Card, CardContent, TextField, Button, Typography, Box, Fade } from '@mui/material';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8080/api/login', { username, password });
      onLogin(response.data.token, response.data.role);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        // background: 'linear-gradient(135deg, #2196F3, #21CBF3)', // Gradient background
        backdropFilter: 'blur(8px)', // Blur effect
        WebkitBackdropFilter: 'blur(8px)', // For Safari compatibility
      }}
    >
      <Fade in timeout={600}>
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.9)', // Translucent white
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            p: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: 'bold', color: '#1976D2' }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Sign in to manage customers
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
              {error && (
                <Typography color="error" align="center" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: '8px',
                  backgroundColor: '#1976D2',
                  '&:hover': { backgroundColor: '#1565C0' },
                  textTransform: 'none',
                  fontSize: '1.1rem',
                }}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}

export default Login;