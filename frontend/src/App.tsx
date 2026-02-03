import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import ShiftCalendar from './pages/ShiftCalendar'
import StaffManagement from './pages/StaffManagement'
import ShiftPatterns from './pages/ShiftPatterns'
import Constraints from './pages/Constraints'
import ShiftRequests from './pages/ShiftRequests'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Register from './pages/Register'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading-screen">読み込み中...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading-screen">読み込み中...</div>
  }

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="shift" element={<ShiftCalendar />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="patterns" element={<ShiftPatterns />} />
        <Route path="constraints" element={<Constraints />} />
        <Route path="requests" element={<ShiftRequests />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Redirect old paths to new /app prefix */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/shift" element={<Navigate to="/app/shift" replace />} />
      <Route path="/staff" element={<Navigate to="/app/staff" replace />} />
      <Route path="/patterns" element={<Navigate to="/app/patterns" replace />} />
      <Route path="/constraints" element={<Navigate to="/app/constraints" replace />} />
      <Route path="/requests" element={<Navigate to="/app/requests" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
    </Routes>
  )
}

export default App
