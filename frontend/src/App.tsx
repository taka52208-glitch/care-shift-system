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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="shift" element={<ShiftCalendar />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="patterns" element={<ShiftPatterns />} />
        <Route path="constraints" element={<Constraints />} />
        <Route path="requests" element={<ShiftRequests />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App
