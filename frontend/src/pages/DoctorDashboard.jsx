import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, Alert, CircularProgress, Chip, IconButton,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Avatar, Tooltip, Snackbar
} from '@mui/material'
import {
  Dashboard, Add, Search, History, Warning,
  Logout, LocalHospital, Shield, Edit, Delete,
  Close, MedicalServices, Person, Menu
} from '@mui/icons-material'
import {
  createRecord, updateRecord, deleteRecord,
  searchPatientRecords, getVersionHistory, emergencyAccess
} from '../api/axios'

const DRAWER_WIDTH = 240

const DoctorDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search
  const [searchPatientID, setSearchPatientID] = useState('')

  // Create record dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    patient_id: '', diagnosis: '', treatment: ''
  })

  // Update record dialog
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    record_id: '', diagnosis: '', treatment: ''
  })

  // Version history dialog
  const [historyOpen, setHistoryOpen] = useState(false)

  // Emergency access dialog
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [emergencyRecordID, setEmergencyRecordID] = useState('')
  const [emergencyResult, setEmergencyResult] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = async () => {
    if (!searchPatientID) return
    setLoading(true)
    setError('')
    try {
      const res = await searchPatientRecords(searchPatientID)
      setRecords(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'No records found')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    setLoading(true)
    setError('')
    try {
      await createRecord(
        Number(createForm.patient_id),
        createForm.diagnosis,
        createForm.treatment
      )
      setSuccess('Record created successfully')
      setCreateOpen(false)
      setCreateForm({ patient_id: '', diagnosis: '', treatment: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create record')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRecord = async () => {
    setLoading(true)
    setError('')
    try {
      await updateRecord(updateForm.record_id, updateForm.diagnosis, updateForm.treatment)
      setSuccess('Record updated successfully')
      setUpdateOpen(false)
      if (searchPatientID) handleSearch()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update record')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (recordID) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return
    setLoading(true)
    try {
      await deleteRecord(recordID)
      setSuccess('Record deleted successfully')
      if (searchPatientID) handleSearch()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete record')
    } finally {
      setLoading(false)
    }
  }

  const handleViewHistory = async (recordID) => {
    setLoading(true)
    try {
      const res = await getVersionHistory(recordID)
      setVersions(res.data)
      setHistoryOpen(true)
    } catch (err) {
      setError('Failed to fetch version history')
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyAccess = async () => {
    if (!emergencyRecordID) return
    setLoading(true)
    try {
      const res = await emergencyAccess(emergencyRecordID)
      setEmergencyResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Emergency access failed')
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'records', label: 'Patient Records', icon: <MedicalServices /> },
    { id: 'emergency', label: 'Emergency Access', icon: <Warning /> },
  ]

  const drawer = (
    <Box sx={{
      height: '100%',
      background: 'linear-gradient(180deg, #0a0d14 0%, #0f1520 100%)',
      borderRight: '1px solid rgba(0,229,255,0.1)',
    }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,255,136,0.2))',
          border: '1px solid rgba(0,229,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LocalHospital sx={{ fontSize: 20, color: '#00e5ff' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="white">
            HealthVault
          </Typography>
          <Typography variant="caption" color="#00ff88">
            Doctor Portal
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* User info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #00e5ff, #00b4d8)',
          color: '#0a0d14', fontSize: '14px', fontWeight: 700
        }}>
          DR
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600} color="white">
            Dr. {user?.email?.split('@')[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {user?.id}
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
              borderRadius: '8px',
              mb: 0.5,
              cursor: 'pointer',
              background: activeTab === item.id
                ? 'rgba(0,229,255,0.1)'
                : 'transparent',
              border: activeTab === item.id
                ? '1px solid rgba(0,229,255,0.2)'
                : '1px solid transparent',
              '&:hover': {
                background: 'rgba(0,229,255,0.06)',
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 36,
              color: activeTab === item.id ? '#00e5ff' : 'text.secondary'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? '#00e5ff' : 'text.primary'
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Shield sx={{ fontSize: '14px !important' }} />}
              label="Encrypted Session"
              size="small"
              sx={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.2)',
                color: '#00ff88',
                fontSize: '11px',
              }}
            />
          </Box>
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Box>
              <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
                Welcome back, Doctor 👋
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                All patient data is AES-256 encrypted and audit logged.
              </Typography>

              {/* Stat cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                {[
                  { label: 'Encryption', value: 'AES-256', color: '#00e5ff', icon: <Shield /> },
                  { label: 'Audit Log', value: 'Active', color: '#00ff88', icon: <MedicalServices /> },
                  { label: 'Role', value: 'Doctor', color: '#c084fc', icon: <Person /> },
                  { label: 'Session', value: 'Secure', color: '#ffd166', icon: <LocalHospital /> },
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

              {/* Quick actions */}
              <Paper sx={{ p: 3, borderRadius: '12px' }}>
                <Typography variant="subtitle1" fontWeight={600} color="white" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #00e5ff, #00b4d8)',
                      color: '#0a0d14', fontWeight: 700,
                    }}
                  >
                    Create Record
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={() => setActiveTab('records')}
                    sx={{ borderColor: 'rgba(0,229,255,0.3)', color: '#00e5ff' }}
                  >
                    Search Patient
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Warning />}
                    onClick={() => setActiveTab('emergency')}
                    sx={{ borderColor: 'rgba(255,71,87,0.3)', color: '#ff4757' }}
                  >
                    Emergency Access
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <Box>
              {/* Search bar */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} color="white" gutterBottom>
                  Search Patient Records
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    size="small"
                    label="Patient ID"
                    value={searchPatientID}
                    onChange={(e) => setSearchPatientID(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    sx={{ flex: 1 }}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <Search />}
                    sx={{
                      background: 'linear-gradient(135deg, #00e5ff, #00b4d8)',
                      color: '#0a0d14', fontWeight: 700,
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setCreateOpen(true)}
                    startIcon={<Add />}
                    sx={{
                      background: 'linear-gradient(135deg, #00ff88, #00e5a0)',
                      color: '#0a0d14', fontWeight: 700,
                    }}
                  >
                    New Record
                  </Button>
                </Box>
              </Paper>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Records table */}
              {records.length > 0 && (
                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { borderColor: 'rgba(255,255,255,0.06)', color: 'text.secondary', fontSize: '12px', fontWeight: 600 } }}>
                        <TableCell>ID</TableCell>
                        <TableCell>Patient ID</TableCell>
                        <TableCell>Diagnosis</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Version</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow
                          key={record.ID}
                          sx={{
                            '& td': { borderColor: 'rgba(255,255,255,0.04)' },
                            '&:hover': { background: 'rgba(0,229,255,0.03)' }
                          }}
                        >
                          <TableCell>
                            <Chip label={`#${record.ID}`} size="small"
                              sx={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontSize: '11px' }} />
                          </TableCell>
                          <TableCell color="white">{record.PatientID}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap>{record.Diagnosis}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap>{record.Treatment}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`v${record.Version}`} size="small"
                              sx={{ background: 'rgba(192,132,252,0.1)', color: '#c084fc', fontSize: '11px' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(record.CreatedAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" sx={{ color: '#00e5ff' }}
                                  onClick={() => {
                                    setUpdateForm({
                                      record_id: record.ID,
                                      diagnosis: record.Diagnosis,
                                      treatment: record.Treatment
                                    })
                                    setUpdateOpen(true)
                                  }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Version History">
                                <IconButton size="small" sx={{ color: '#c084fc' }}
                                  onClick={() => handleViewHistory(record.ID)}>
                                  <History fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" sx={{ color: '#ff4757' }}
                                  onClick={() => handleDeleteRecord(record.ID)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {records.length === 0 && !loading && !error && (
                <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
                  <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Enter a patient ID to search their records
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <Box>
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  background: 'rgba(255,209,102,0.08)',
                  border: '1px solid rgba(255,209,102,0.3)',
                  color: '#ffd166',
                  '& .MuiAlert-icon': { color: '#ffd166' }
                }}
              >
                Emergency access is fully audit logged with your user ID, timestamp, and Ed25519 signature.
                All access is traceable and cannot be tampered with.
              </Alert>

              <Paper sx={{ p: 3, borderRadius: '12px', maxWidth: 500 }}>
                <Typography variant="subtitle1" fontWeight={600} color="white" gutterBottom>
                  Emergency Record Access
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Access any patient record in an emergency. This action is permanently logged.
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Record ID"
                  value={emergencyRecordID}
                  onChange={(e) => setEmergencyRecordID(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleEmergencyAccess}
                  disabled={loading || !emergencyRecordID}
                  startIcon={loading ? <CircularProgress size={16} /> : <Warning />}
                  sx={{
                    background: 'linear-gradient(135deg, #ff4757, #c0392b)',
                    fontWeight: 700,
                    '&:hover': { background: 'linear-gradient(135deg, #ff6b6b, #ff4757)' }
                  }}
                >
                  Access Emergency Record
                </Button>

                {emergencyResult && (
                  <Box sx={{ mt: 3 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Emergency access granted — logged to audit chain
                    </Alert>
                    <Paper sx={{
                      p: 2, borderRadius: '8px',
                      background: 'rgba(0,229,255,0.05)',
                      border: '1px solid rgba(0,229,255,0.15)'
                    }}>
                      <Typography variant="caption" color="text.secondary">DIAGNOSIS</Typography>
                      <Typography variant="body2" color="white" sx={{ mb: 1 }}>
                        {emergencyResult.Diagnosis}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">TREATMENT</Typography>
                      <Typography variant="body2" color="white">
                        {emergencyResult.Treatment}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* Create Record Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: '#0f1520', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>Create Medical Record</Typography>
          <IconButton onClick={() => setCreateOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Patient ID" type="number"
            value={createForm.patient_id}
            onChange={(e) => setCreateForm({ ...createForm, patient_id: e.target.value })}
            sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Diagnosis" multiline rows={3}
            value={createForm.diagnosis}
            onChange={(e) => setCreateForm({ ...createForm, diagnosis: e.target.value })}
            sx={{ mb: 2 }} />
          <TextField fullWidth label="Treatment" multiline rows={3}
            value={createForm.treatment}
            onChange={(e) => setCreateForm({ ...createForm, treatment: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRecord} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #00e5ff, #00b4d8)', color: '#0a0d14', fontWeight: 700 }}>
            {loading ? <CircularProgress size={18} /> : 'Create Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Record Dialog */}
      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: '#0f1520', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>Update Record #{updateForm.record_id}</Typography>
          <IconButton onClick={() => setUpdateOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Diagnosis" multiline rows={3}
            value={updateForm.diagnosis}
            onChange={(e) => setUpdateForm({ ...updateForm, diagnosis: e.target.value })}
            sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Treatment" multiline rows={3}
            value={updateForm.treatment}
            onChange={(e) => setUpdateForm({ ...updateForm, treatment: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUpdateOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateRecord} disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #00e5ff, #00b4d8)', color: '#0a0d14', fontWeight: 700 }}>
            {loading ? <CircularProgress size={18} /> : 'Update Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { background: '#0f1520', border: '1px solid rgba(192,132,252,0.15)', borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>Version History</Typography>
          <IconButton onClick={() => setHistoryOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {versions.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>No previous versions found.</Typography>
          ) : (
            versions.map((v) => (
              <Paper key={v.ID} sx={{
                p: 2, mb: 2, borderRadius: '8px',
                background: 'rgba(192,132,252,0.05)',
                border: '1px solid rgba(192,132,252,0.15)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip label={`Version ${v.Version}`} size="small"
                    sx={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc' }} />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(v.CreatedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">DIAGNOSIS</Typography>
                <Typography variant="body2" color="white" sx={{ mb: 1 }}>{v.Diagnosis}</Typography>
                <Typography variant="caption" color="text.secondary">TREATMENT</Typography>
                <Typography variant="body2" color="white">{v.Treatment}</Typography>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryOpen(false)} sx={{ color: 'text.secondary' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  )
}

export default DoctorDashboard