import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../api/axios'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton, Divider,
} from '@mui/material'
import {
  Lock, Email, Visibility, VisibilityOff,
  LocalHospital, Shield,
} from '@mui/icons-material'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginUser(email, password)
      const { access_token, refresh_token } = res.data

      const payload = JSON.parse(atob(access_token.split('.')[1]))
      const userData = {
        id: payload.user_id,
        role: payload.role,
        email: email,
      }

      login(userData, access_token, refresh_token)

      if (payload.role === 'doctor') navigate('/doctor')
      else if (payload.role === 'patient') navigate('/patient')
      else if (payload.role === 'admin') navigate('/admin')

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0d14 0%, #0f1a2e 50%, #0a0d14 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background grid */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      {/* Glow effects */}
      <Box sx={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        top: '10%', left: '10%', pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
        bottom: '10%', right: '10%', pointerEvents: 'none',
      }} />

      <Paper elevation={0} sx={{
        width: '100%', maxWidth: '420px', p: 4, mx: 2,
        background: 'rgba(15, 21, 32, 0.95)',
        border: '1px solid rgba(0, 229, 255, 0.15)',
        borderRadius: '16px', backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,255,136,0.15))',
            border: '1px solid rgba(0,229,255,0.2)', mb: 2,
          }}>
            <LocalHospital sx={{ fontSize: 32, color: '#00e5ff' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
            HealthVault
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Encrypted Health Data System
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

        <Box component="form" onSubmit={handleLogin}>
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

          <TextField
            fullWidth label="Email Address" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
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
            value={password} onChange={(e) => setPassword(e.target.value)}
            required sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword
                      ? <VisibilityOff sx={{ fontSize: 20 }} />
                      : <Visibility sx={{ fontSize: 20 }} />
                    }
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Forgot password link */}
          <Box sx={{ textAlign: 'right', mb: 3 }}>
            <Link to="/forgot-password" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '13px' }}>
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit" fullWidth variant="contained" disabled={loading}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #00e5ff, #00b4d8)',
              color: '#0a0d14', fontWeight: 700, fontSize: '15px',
              '&:hover': { background: 'linear-gradient(135deg, #00ff88, #00e5ff)' },
              '&:disabled': { background: 'rgba(0,229,255,0.2)' }
            }}
          >
            {loading
              ? <CircularProgress size={22} sx={{ color: '#0a0d14' }} />
              : 'Sign In Securely'
            }
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{
          mt: 3, pt: 3,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>
              Create Account
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All data encrypted with AES-256 • Hash-chain audit logs • Ed25519 signed
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login