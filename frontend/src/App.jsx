import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Snowfall from 'react-snowfall'
import HomePage from './pages/HomePage'
import CustomerInterface from './pages/CustomerInterface'
import StaffLogin from './pages/StaffLogin'
import StaffDashboard from './pages/StaffDashboard'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen relative">
        {/* Snowfall Effect - Applies to all pages */}
        <Snowfall
          snowflakeCount={100}
          speed={[0.5, 2]}
          wind={[-0.5, 1.5]}
          radius={[0.5, 2]}
          color="#ffffff"
          style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/queue/join" element={<CustomerInterface />} />
          <Route path="/staff/login" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

