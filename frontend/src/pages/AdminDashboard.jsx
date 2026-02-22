import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, Chip, Drawer, List,
  ListItem, ListItemIcon, ListItemText, Divider,
  Avatar, IconButton, TextField, Pagination
} from '@mui/material'
import {
  Dashboard, MedicalServices, Logout, LocalHospital,
  Shield, Menu, VerifiedUser, Warning, CheckCircle,
  Cancel, FilterList, Refresh
} from '@mui/icons-material'
import {
  getAllRecords, getAuditLogs, filterAuditLogs,
  verifyAuditChain, checkHealth
} from '../api/axios'

const DRAWER_WIDTH = 240

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Records
  const [records, setRecords] = useState([])

  // Audit logs
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)

  // Filters
  const [filterUserID, setFilterUserID] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  const [filtersApplied, setFiltersApplied] = useState(false)

  // Chain verification
  const [chainStatus, setChainStatus] = useState(null)
  const [chainLoading, setChainLoading] = useState(false)

  // Health
  const [health, setHealth] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllRecords()
      setRecords(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await getAuditLogs(page, 15)
      setLogs(res.data.data)
      setLogsTotal(res.data.total)
      setLogsTotalPages(res.data.pages)
      setLogsPage(page)
      setFiltersApplied(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page: 1, page_size: 15 }
      if (filterUserID) params.user_id = filterUserID
      if (filterAction) params.action = filterAction
      if (filterFromDate) params.from_date = filterFromDate
      if (filterToDate) params.to_date = filterToDate

      const res = await filterAuditLogs(params)
      setLogs(res.data.data)
      setLogsTotal(res.data.total)
      setLogsTotalPages(res.data.pages)
      setLogsPage(1)
      setFiltersApplied(true)
    } catch (err) {
      setError('Failed to filter audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyChain = async () => {
    setChainLoading(true)
    setChainStatus(null)
    try {
      const res = await verifyAuditChain()
      setChainStatus({ verified: true, message: res.data.message })
    } catch (err) {
      setChainStatus({
        verified: false,
        message: err.response?.data?.error || 'Chain verification failed'
      })
    } finally {
      setChainLoading(false)
    }
  }

  const fetchHealth = async () => {
    try {
      const res = await checkHealth()
      setHealth(res.data)
    } catch {
      setHealth({ status: 'error', database: 'unreachable' })
    }
  }

  useEffect(() => {
    if (activeTab === 'records') fetchRecords()
    if (activeTab === 'audit') fetchAuditLogs(1)
    if (activeTab === 'dashboard') fetchHealth()
  }, [activeTab])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'records', label: 'All Records', icon: <MedicalServices /> },
    { id: 'audit', label: 'Audit Logs', icon: <VerifiedUser /> },
  ]

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE_RECORD': return '#00ff88'
      case 'UPDATE_RECORD': return '#00e5ff'
      case 'DELETE_RECORD': return '#ff4757'
      case 'EMERGENCY_ACCESS': return '#ffd166'
      case 'READ_RECORDS': return '#c084fc'
      case 'SEARCH_PATIENT_RECORDS': return '#fb923c'
      default: return '#94a3b8'
    }
  }

  const drawer = (
    <Box sx={{
      height: '100%',
      background: 'linear-gradient(180deg, #0a0d14 0%, #0f1520 100%)',
      borderRight: '1px solid rgba(192,132,252,0.1)',
    }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(0,229,255,0.2))',
          border: '1px solid rgba(192,132,252,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LocalHospital sx={{ fontSize: 20, color: '#c084fc' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="white">
            HealthVault
          </Typography>
          <Typography variant="caption" color="#c084fc">
            Admin Portal
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* User info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #c084fc, #a855f7)',
          color: 'white', fontSize: '14px', fontWeight: 700
        }}>
          AD
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600} color="white">
            {user?.email?.split('@')[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Administrator
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
                ? 'rgba(192,132,252,0.1)' : 'transparent',
              border: activeTab === item.id
                ? '1px solid rgba(192,132,252,0.2)' : '1px solid transparent',
              '&:hover': { background: 'rgba(192,132,252,0.06)' }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 36,
              color: activeTab === item.id ? '#c084fc' : 'text.secondary'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: activeTab === item.id ? 600 : 400,
                color: activeTab === item.id ? '#c084fc' : 'text.primary'
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
            label="Admin Session"
            size="small"
            sx={{
              background: 'rgba(192,132,252,0.08)',
              border: '1px solid rgba(192,132,252,0.2)',
              color: '#c084fc', fontSize: '11px',
            }}
          />
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Box>
              <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
                System Overview 🛡️
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Full system visibility with tamper-proof audit logging.
              </Typography>

              {/* Stat cards */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2, mb: 3
              }}>
                {[
                  { label: 'Encryption', value: 'AES-256', color: '#00e5ff', icon: <Shield /> },
                  { label: 'Signatures', value: 'Ed25519', color: '#00ff88', icon: <VerifiedUser /> },
                  { label: 'Audit Chain', value: 'SHA-256', color: '#c084fc', icon: <CheckCircle /> },
                  { label: 'DB Status', value: health?.database === 'ok' ? 'Online' : 'Checking...', color: health?.database === 'ok' ? '#00ff88' : '#ffd166', icon: <LocalHospital /> },
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

              {/* Chain verification panel */}
              <Paper sx={{
                p: 3, borderRadius: '12px', mb: 3,
                background: 'rgba(192,132,252,0.04)',
                border: '1px solid rgba(192,132,252,0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} color="white">
                      Audit Chain Integrity
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verify the entire audit log hash chain and Ed25519 signatures
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleVerifyChain}
                    disabled={chainLoading}
                    startIcon={chainLoading
                      ? <CircularProgress size={16} sx={{ color: 'white' }} />
                      : <VerifiedUser />
                    }
                    sx={{
                      background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                      fontWeight: 700,
                    }}
                  >
                    Verify Chain
                  </Button>
                </Box>

                {chainStatus && (
                  <Alert
                    severity={chainStatus.verified ? 'success' : 'error'}
                    icon={chainStatus.verified
                      ? <CheckCircle /> : <Cancel />
                    }
                    sx={{
                      background: chainStatus.verified
                        ? 'rgba(0,255,136,0.08)' : 'rgba(255,71,87,0.08)',
                      border: `1px solid ${chainStatus.verified
                        ? 'rgba(0,255,136,0.2)' : 'rgba(255,71,87,0.2)'}`,
                      color: chainStatus.verified ? '#00ff88' : '#ff4757',
                      '& .MuiAlert-icon': {
                        color: chainStatus.verified ? '#00ff88' : '#ff4757'
                      }
                    }}
                  >
                    {chainStatus.message}
                  </Alert>
                )}
              </Paper>

              {/* Health status */}
              {health && (
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="subtitle1" fontWeight={600} color="white" gutterBottom>
                    System Health
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CheckCircle />}
                      label={`Server: ${health.status}`}
                      sx={{
                        background: 'rgba(0,255,136,0.1)',
                        color: '#00ff88',
                        border: '1px solid rgba(0,255,136,0.2)'
                      }}
                    />
                    <Chip
                      icon={health.database === 'ok' ? <CheckCircle /> : <Warning />}
                      label={`Database: ${health.database}`}
                      sx={{
                        background: health.database === 'ok'
                          ? 'rgba(0,255,136,0.1)' : 'rgba(255,71,87,0.1)',
                        color: health.database === 'ok' ? '#00ff88' : '#ff4757',
                        border: `1px solid ${health.database === 'ok'
                          ? 'rgba(0,255,136,0.2)' : 'rgba(255,71,87,0.2)'}`
                      }}
                    />
                    <Chip
                      label={`Uptime: ${health.uptime}`}
                      sx={{
                        background: 'rgba(0,229,255,0.1)',
                        color: '#00e5ff',
                        border: '1px solid rgba(0,229,255,0.2)'
                      }}
                    />
                    <Chip
                      label={`Version: ${health.version}`}
                      sx={{
                        background: 'rgba(192,132,252,0.1)',
                        color: '#c084fc',
                        border: '1px solid rgba(192,132,252,0.2)'
                      }}
                    />
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* All Records Tab */}
          {activeTab === 'records' && (
            <Box>
              <Box sx={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', mb: 3
              }}>
                <Typography variant="h6" fontWeight={600} color="white">
                  All Medical Records ({records.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchRecords}
                  disabled={loading}
                  startIcon={<Refresh />}
                  sx={{ borderColor: 'rgba(192,132,252,0.3)', color: '#c084fc' }}
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
                  <CircularProgress sx={{ color: '#c084fc' }} />
                </Box>
              )}

              {!loading && records.length === 0 && (
                <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
                  <MedicalServices sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No records found</Typography>
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
                          fontSize: '12px', fontWeight: 600
                        }
                      }}>
                        <TableCell>ID</TableCell>
                        <TableCell>Patient ID</TableCell>
                        <TableCell>Doctor ID</TableCell>
                        <TableCell>Diagnosis</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Version</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow
                          key={record.ID}
                          sx={{
                            '& td': { borderColor: 'rgba(255,255,255,0.04)' },
                            '&:hover': { background: 'rgba(192,132,252,0.03)' }
                          }}
                        >
                          <TableCell>
                            <Chip label={`#${record.ID}`} size="small"
                              sx={{ background: 'rgba(192,132,252,0.1)', color: '#c084fc', fontSize: '11px' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="white">{record.PatientID}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="white">{record.DoctorID}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180 }}>
                            <Typography variant="body2" noWrap>{record.Diagnosis}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 180 }}>
                            <Typography variant="body2" noWrap>{record.Treatment}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`v${record.Version}`} size="small"
                              sx={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontSize: '11px' }} />
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

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <Box>
              {/* Filter panel */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FilterList sx={{ color: '#c084fc', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={600} color="white">
                    Filter Audit Logs
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 2, mb: 2
                }}>
                  <TextField
                    size="small" label="User ID"
                    value={filterUserID}
                    onChange={(e) => setFilterUserID(e.target.value)}
                  />
                  <TextField
                    size="small" label="Action"
                    placeholder="e.g. CREATE_RECORD"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                  />
                  <TextField
                    size="small" label="From Date"
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small" label="To Date"
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleFilterLogs}
                    disabled={loading}
                    startIcon={<FilterList />}
                    sx={{
                      background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                      fontWeight: 700,
                    }}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFilterUserID('')
                      setFilterAction('')
                      setFilterFromDate('')
                      setFilterToDate('')
                      fetchAuditLogs(1)
                    }}
                    sx={{ borderColor: 'rgba(192,132,252,0.3)', color: '#c084fc' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleVerifyChain}
                    disabled={chainLoading}
                    startIcon={chainLoading
                      ? <CircularProgress size={14} />
                      : <VerifiedUser />
                    }
                    sx={{ borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88', ml: 'auto' }}
                  >
                    Verify Chain
                  </Button>
                </Box>

                {chainStatus && (
                  <Alert
                    severity={chainStatus.verified ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                    onClose={() => setChainStatus(null)}
                  >
                    {chainStatus.message}
                  </Alert>
                )}
              </Paper>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Total count */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {filtersApplied ? `Filtered results: ` : `Total entries: `}
                  <Typography component="span" color="white" fontWeight={600}>
                    {logsTotal}
                  </Typography>
                </Typography>
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#c084fc' }} />
                </Box>
              )}

              {!loading && logs?.length > 0 && (
                <>
                  <TableContainer component={Paper} sx={{ borderRadius: '12px', mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{
                          '& th': {
                            borderColor: 'rgba(255,255,255,0.06)',
                            color: 'text.secondary',
                            fontSize: '11px', fontWeight: 600
                          }
                        }}>
                          <TableCell>ID</TableCell>
                          <TableCell>User ID</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Record ID</TableCell>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Hash</TableCell>
                          <TableCell>Signed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow
                            key={log.ID}
                            sx={{
                              '& td': { borderColor: 'rgba(255,255,255,0.04)' },
                              '&:hover': { background: 'rgba(192,132,252,0.03)' }
                            }}
                          >
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                #{log.ID}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="white">
                                {log.UserID}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.Action}
                                size="small"
                                sx={{
                                  background: `${getActionColor(log.Action)}18`,
                                  color: getActionColor(log.Action),
                                  fontSize: '10px',
                                  border: `1px solid ${getActionColor(log.Action)}40`
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {log.RecordID ? `#${log.RecordID}` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(log.Timestamp).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: '#00e5ff',
                                  fontSize: '10px'
                                }}
                              >
                                {log.Hash?.substring(0, 12)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
                                label="Ed25519"
                                size="small"
                                sx={{
                                  background: 'rgba(0,255,136,0.08)',
                                  color: '#00ff88',
                                  fontSize: '10px',
                                  border: '1px solid rgba(0,255,136,0.2)'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  {!filtersApplied && logsTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        count={logsTotalPages}
                        page={logsPage}
                        onChange={(_, page) => fetchAuditLogs(page)}
                        sx={{
                          '& .MuiPaginationItem-root': {
                            color: 'text.secondary',
                            '&.Mui-selected': {
                              background: 'rgba(192,132,252,0.2)',
                              color: '#c084fc',
                            }
                          }
                        }}
                      />
                    </Box>
                  )}
                </>
              )}

              {!loading && (!logs || logs.length === 0) && (
                <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
                  <VerifiedUser sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No audit logs found</Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default AdminDashboard