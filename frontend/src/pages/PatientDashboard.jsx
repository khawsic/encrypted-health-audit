import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Chip, Drawer, List,
  ListItem, ListItemIcon, ListItemText, Divider,
  Avatar, IconButton
} from '@mui/material'
import {
  Dashboard, MedicalServices, Logout,
  LocalHospital, Shield, Person, Menu
} from '@mui/icons-material'
import { getPatientRecords } from '../api/axios'

const DRAWER_WIDTH = 240

const PatientDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPatientRecords()
      setRecords(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords()
    }
  }, [activeTab])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'records', label: 'My Records', icon: <MedicalServices /> },
  ]

  const drawer = (
    <Box sx={{
      height: '100%',
      background: 'linear-gradient(180deg, #0a0d14 0%, #0f1520 100%)',
      borderRight: '1px solid rgba(0,255,136,0.1)',
    }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,229,255,0.2))',
          border: '1px solid rgba(0,255,136,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LocalHospital sx={{ fontSize: 20, color: '#00ff88' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="white">
            HealthVault
          </Typography>
          <Typography variant="caption" color="#00ff88">
            Patient Portal
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* User info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #00ff88, #00e5a0)',
          color: '#0a0d14', fontSize: '14px', fontWeight: 700
        }}>
          PT
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600} color="white">
            {user?.email?.split('@')[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Patient ID: {user?.id}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

      {/* Nav items */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            sx={{
              borderRadius: '8px', mb: 0.5, cursor: 'pointer',
              background: activeTab === item.id
                ? 'rgba(0,255,136,0.1)' : 'transparent',
              border: activeTab === item.id
                ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
              '&:hover': { background: 'rgba(0,255,136,0.06)' }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 36,
              color: activeTab === item.id ? '#00ff88' : 'text.secondary'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? '#00ff88' : 'text.primary'
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Logout */}
      <Box sx={{ position: 'absolute', bottom: 16, left: 8, right: 8 }}>
        <ListItem
          onClick={handleLogout}
          sx={{
            borderRadius: '8px', cursor: 'pointer',
            '&:hover': { background: 'rgba(255,71,87,0.1)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: '#ff4757' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '14px', color: '#ff4757' }}
          />
        </ListItem>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0a0d14' }}>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(15,21,32,0.8)',
          backdropFilter: 'blur(10px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              sx={{ display: { md: 'none' } }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" fontWeight={700} color="white">
              {menuItems.find(m => m.id === activeTab)?.label}
            </Typography>
          </Box>
          <Chip
            icon={<Shield sx={{ fontSize: '14px !important' }} />}
            label="Encrypted Session"
            size="small"
            sx={{
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.2)',
              color: '#00ff88', fontSize: '11px',
            }}
          />
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Box>
              <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
                Welcome, {user?.email?.split('@')[0]} 👋
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your medical records are encrypted and only visible to you and your doctor.
              </Typography>

              {/* Info cards */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2, mb: 3
              }}>
                {[
                  { label: 'Data Encryption', value: 'AES-256', color: '#00e5ff', icon: <Shield /> },
                  { label: 'Audit Logging', value: 'Active', color: '#00ff88', icon: <MedicalServices /> },
                  { label: 'Your Role', value: 'Patient', color: '#c084fc', icon: <Person /> },
                  { label: 'Access Level', value: 'Read Only', color: '#ffd166', icon: <LocalHospital /> },
                ].map((stat) => (
                  <Paper key={stat.label} sx={{ p: 2.5, borderRadius: '12px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Privacy notice */}
              <Paper sx={{
                p: 3, borderRadius: '12px',
                background: 'rgba(0,255,136,0.04)',
                border: '1px solid rgba(0,255,136,0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Shield sx={{ color: '#00ff88', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600} color="#00ff88">
                    Your Privacy is Protected
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  All your medical records are encrypted with AES-256 before being stored.
                  Only authorized doctors and you can view your data. Every access is
                  logged in a tamper-proof audit chain signed with Ed25519 cryptography.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MedicalServices />}
                  onClick={() => setActiveTab('records')}
                  sx={{ borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }}
                >
                  View My Records
                </Button>
              </Paper>
            </Box>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <Box>
              <Box sx={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', mb: 3
              }}>
                <Typography variant="h6" fontWeight={600} color="white">
                  My Medical Records
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchRecords}
                  disabled={loading}
                  startIcon={loading
                    ? <CircularProgress size={14} />
                    : <MedicalServices />
                  }
                  sx={{ borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }}
                >
                  Refresh
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#00ff88' }} />
                </Box>
              )}

              {!loading && records.length === 0 && !error && (
                <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
                  <MedicalServices sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No medical records found
                  </Typography>
                </Paper>
              )}

              {!loading && records.length > 0 && (
                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{
                        '& th': {
                          borderColor: 'rgba(255,255,255,0.06)',
                          color: 'text.secondary',
                          fontSize: '12px',
                          fontWeight: 600
                        }
                      }}>
                        <TableCell>Record ID</TableCell>
                        <TableCell>Diagnosis</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Doctor ID</TableCell>
                        <TableCell>Version</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow
                          key={record.ID}
                          sx={{
                            '& td': { borderColor: 'rgba(255,255,255,0.04)' },
                            '&:hover': { background: 'rgba(0,255,136,0.03)' }
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={`#${record.ID}`}
                              size="small"
                              sx={{
                                background: 'rgba(0,255,136,0.1)',
                                color: '#00ff88', fontSize: '11px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="white">
                              {record.Diagnosis}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="white">
                              {record.Treatment}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              Dr. #{record.DoctorID}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`v${record.Version}`}
                              size="small"
                              sx={{
                                background: 'rgba(192,132,252,0.1)',
                                color: '#c084fc', fontSize: '11px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(record.CreatedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default PatientDashboard