import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/axios'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton,
  Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material'
import {
  Lock, Email, Visibility, VisibilityOff,
  LocalHospital, Shield, Person, MedicalServices
} from '@mui/icons-material'

const Register = () => {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await registerUser(name, email, password, role)
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0d14 0%, #0f1a2e 50%, #0a0d14 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow effects */}
      <Box sx={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
        top: '10%', left: '10%', pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', width: '300px', height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        bottom: '10%', right: '10%', pointerEvents: 'none',
      }} />

      <Paper elevation={0} sx={{
        width: '100%', maxWidth: '440px', p: 4, mx: 2,
        background: 'rgba(15, 21, 32, 0.95)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,255,136,0.15))',
            border: '1px solid rgba(0,229,255,0.2)', mb: 2,
          }}>
            <LocalHospital sx={{ fontSize: 32, color: '#00e5ff' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HealthVault — Encrypted Health Data System
          </Typography>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            mt: 1, px: 1.5, py: 0.5, borderRadius: '20px',
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.2)',
          }}>
            <Shield sx={{ fontSize: 12, color: '#00ff88' }} />
            <Typography variant="caption" color="#00ff88" fontWeight={600}>
              AES-256 Encrypted
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Box component="form" onSubmit={handleRegister}>

          {error && (
            <Alert severity="error" sx={{
              mb: 2,
              background: 'rgba(255,71,87,0.1)',
              border: '1px solid rgba(255,71,87,0.3)',
              color: '#ff4757',
              '& .MuiAlert-icon': { color: '#ff4757' }
            }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{
              mb: 2,
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.2)',
              color: '#00ff88',
              '& .MuiAlert-icon': { color: '#00ff88' }
            }}>
              {success}
            </Alert>
          )}

          {/* Role selector */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Register as
            </Typography>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, val) => val && setRole(val)}
              fullWidth
              size="small"
            >
              <ToggleButton value="patient" sx={{
                border: '1px solid rgba(0,255,136,0.2)',
                color: 'text.secondary',
                '&.Mui-selected': {
                  background: 'rgba(0,255,136,0.1)',
                  color: '#00ff88',
                  border: '1px solid rgba(0,255,136,0.3)',
                }
              }}>
                <Person sx={{ mr: 0.5, fontSize: 18 }} />
                Patient
              </ToggleButton>
              <ToggleButton value="doctor" sx={{
                border: '1px solid rgba(0,229,255,0.2)',
                color: 'text.secondary',
                '&.Mui-selected': {
                  background: 'rgba(0,229,255,0.1)',
                  color: '#00e5ff',
                  border: '1px solid rgba(0,229,255,0.3)',
                }
              }}>
                <MedicalServices sx={{ mr: 0.5, fontSize: 18 }} />
                Doctor
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth label="Full Name" value={name}
            onChange={(e) => setName(e.target.value)}
            required sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth label="Email Address" type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end" size="small"
                  >
                    {showPassword
                      ? <VisibilityOff sx={{ fontSize: 20 }} />
                      : <Visibility sx={{ fontSize: 20 }} />
                    }
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit" fullWidth variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #00e5ff, #00b4d8)',
              color: '#0a0d14', fontWeight: 700, fontSize: '15px',
              '&:hover': {
                background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
              },
              '&:disabled': { background: 'rgba(0,229,255,0.2)' }
            }}
          >
            {loading
              ? <CircularProgress size={22} sx={{ color: '#0a0d14' }} />
              : 'Create Account'
            }
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{
          mt: 3, pt: 3,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Register