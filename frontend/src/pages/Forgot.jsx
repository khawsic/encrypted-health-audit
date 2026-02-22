import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../api/axios'
import {
  Box, Paper, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, Divider, Stepper,
  Step, StepLabel
} from '@mui/material'
import {
  Email, Lock, LocalHospital, Shield, Key
} from '@mui/icons-material'

const steps = ['Enter Email', 'Reset Password']

const ForgotPassword = () => {
  const navigate = useNavigate()

  const [activeStep, setActiveStep] = useState(0)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestPasswordReset(email)
      // In production this would be emailed
      // For demo we show the token directly
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token)
      }
      setActiveStep(1)
    } catch {
      setError('Failed to send reset request')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await resetPassword(resetToken, newPassword)
      setSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Token may have expired.')
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

      <Paper elevation={0} sx={{
        width: '100%', maxWidth: '420px', p: 4, mx: 2,
        background: 'rgba(15, 21, 32, 0.95)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: '16px', backdropFilter: 'blur(20px)',
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
            Reset Password
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
              Secure Reset Flow
            </Typography>
          </Box>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { color: 'text.secondary', fontSize: '12px' },
                '& .MuiStepLabel-label.Mui-active': { color: '#00e5ff' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#00ff88' },
                '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.1)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#00e5ff' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00ff88' },
              }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

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

        {/* Step 1 — Enter email */}
        {activeStep === 0 && (
          <Box component="form" onSubmit={handleRequestReset}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a reset token.
            </Typography>
            <TextField
              fullWidth label="Email Address" type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                color: '#0a0d14', fontWeight: 700,
                '&:hover': { background: 'linear-gradient(135deg, #00ff88, #00e5ff)' },
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#0a0d14' }} />
                : 'Send Reset Token'
              }
            </Button>
          </Box>
        )}

        {/* Step 2 — Reset password */}
        {activeStep === 1 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your reset token and choose a new password.
            </Typography>

            <TextField
              fullWidth label="Reset Token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required sx={{ mb: 2 }}
              helperText="Check your email or use the token shown above"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Key sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth label="New Password" type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth label="Confirm New Password" type="password"
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
                color: '#0a0d14', fontWeight: 700,
                '&:hover': { background: 'linear-gradient(135deg, #00ff88, #00e5ff)' },
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#0a0d14' }} />
                : 'Reset Password'
              }
            </Button>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{
          mt: 3, pt: 3,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default ForgotPassword