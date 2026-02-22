import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import AdminDashboard from './pages/AdminDashboard'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, accessToken } = useAuth()

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => {
  const { user, accessToken } = useAuth()

  const getHome = () => {
    if (!user || !accessToken) return '/login'
    if (user.role === 'doctor') return '/doctor'
    if (user.role === 'patient') return '/patient'
    if (user.role === 'admin') return '/admin'
    return '/login'
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/doctor" element={
        <ProtectedRoute allowedRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      } />

      <Route path="/patient" element={
        <ProtectedRoute allowedRole="patient">
          <PatientDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={getHome()} replace />} />
    </Routes>
  )
}

export default App