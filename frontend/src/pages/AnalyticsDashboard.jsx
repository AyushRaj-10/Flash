import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { analyticsAPI, queueAPI } from '../utils/api'
import wsClient from '../utils/websocket'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { Trash2, Users, Clock, TrendingUp } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function AnalyticsDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalServed: 0,
    totalParties: 0,
    averagePartySize: 0,
    averageWaitTime: 15,
    currentQueueLength: 0,
    hourlyData: {}
  })
  
  const [seatedCustomers, setSeatedCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await analyticsAPI.getStats(dateRange.startDate, dateRange.endDate)
      setStats(response.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Load seated customers
  const loadSeatedCustomers = async () => {
    try {
      const response = await analyticsAPI.getSeated()
      setSeatedCustomers(response.data || [])
    } catch (error) {
      console.error('Error loading seated customers:', error)
    }
  }

  useEffect(() => {
    // Load initial data
    loadAnalytics()
    loadSeatedCustomers()

    // Connect WebSocket for real-time updates
    wsClient.connect()
    
    // Listen for seated updates
    wsClient.on('SEATED_UPDATED', (data) => {
      const seatedList = Array.isArray(data) ? data : []
      setSeatedCustomers(seatedList)
    })

    // Listen for queue updates
    wsClient.on('QUEUE_UPDATED', () => {
      loadAnalytics() // Reload analytics when queue changes
    })

    return () => {
      wsClient.off('SEATED_UPDATED')
      wsClient.off('QUEUE_UPDATED')
    }
  }, [])

  // Reload analytics when date range changes
  const handleDateChange = (field, value) => {
    setDateRange({ ...dateRange, [field]: value })
  }

  const handleApplyFilter = () => {
    loadAnalytics()
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to mark this customer as finished? This will permanently remove them from the system.')) {
      return
    }

    // Find the customer to get their email
    const customerToDelete = seatedCustomers.find(c => {
      const cId = c.customerId || c._id
      return cId === customerId || cId?.toString() === customerId?.toString()
    })

    if (!customerToDelete) {
      toast.error('Customer not found')
      return
    }

    if (!customerToDelete.email) {
      toast.error('Customer email not found, cannot delete')
      return
    }

    try {
      // Optimistically remove from frontend
      setSeatedCustomers(prev => prev.filter(c => {
        const cId = c.customerId || c._id
        return cId !== customerId && cId?.toString() !== customerId?.toString()
      }))
      
      // Delete from database using email
      await queueAPI.deleteByEmail(customerToDelete.email)
      
      // Update stats after successful deletion
      loadAnalytics()
      
      toast.success('Customer marked as finished and removed')
    } catch (error) {
      console.error('Error deleting customer:', error)
      // Restore customer on error
      loadSeatedCustomers()
      toast.error(error.response?.data?.error || 'Failed to remove customer')
    }
  }

  // Prepare hourly data for charts
  // Only show hours that have data
  const hourlyChartData = Object.entries(stats.hourlyData || {})
    .filter(([hour, count]) => count > 0) // Only show hours with data
    .map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      hourNum: parseInt(hour),
      customers: count
    }))
    .sort((a, b) => a.hourNum - b.hourNum)

  // If no hourly data, show empty chart with placeholder
  const hasHourlyData = hourlyChartData.length > 0

  // Chart.js data for Peak Hours (Bar Chart)
  const peakHoursData = {
    labels: hasHourlyData ? hourlyChartData.map(item => item.hour) : ['No data'],
    datasets: [
      {
        label: 'Parties Served',
        data: hasHourlyData ? hourlyChartData.map(item => item.customers) : [0],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  }

  // Chart.js data for Customers Per Hour (Line Chart with Area)
  const customersPerHourData = {
    labels: hasHourlyData ? hourlyChartData.map(item => item.hour) : ['No data'],
    datasets: [
      {
        label: 'Customers',
        data: hasHourlyData ? hourlyChartData.map(item => item.customers) : [0],
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  }

  // Chart.js data for Wait Time Trend (Line Chart)
  const waitTimeData = {
    labels: hasHourlyData ? hourlyChartData.map(item => item.hour) : ['No data'],
    datasets: [
      {
        label: 'Avg Wait Time (min)',
        data: hasHourlyData ? hourlyChartData.map(() => stats.averageWaitTime || 15) : [0],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  }

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#9ca3af'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#9ca3af'
        }
      }
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Restaurant performance insights</p>
          </motion.div>
          <motion.button
            onClick={() => navigate('/staff/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Dashboard
          </motion.button>
        </div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl border border-white/20"
        >
          <h3 className="text-lg font-semibold mb-4 text-white">Date Range</h3>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <motion.button
                onClick={handleApplyFilter}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Apply Filter'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Total Served</p>
              <Users className="text-blue-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.totalServed}</p>
            <p className="text-xs text-gray-400 mt-1">Parties seated</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Total Customers</p>
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-purple-400">{stats.totalParties}</p>
            <p className="text-xs text-gray-400 mt-1">Individual diners</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Avg Party Size</p>
              <Users className="text-green-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.averagePartySize}</p>
            <p className="text-xs text-gray-400 mt-1">People per party</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Avg Wait Time</p>
              <Clock className="text-indigo-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-indigo-400">{stats.averageWaitTime} min</p>
            <p className="text-xs text-gray-400 mt-1">Current average</p>
          </motion.div>
        </div>

        {/* Seated Customers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <Users size={24} className="text-green-400" />
            Currently Seated Customers ({seatedCustomers.length})
          </h3>
          <div className="space-y-3">
            {seatedCustomers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No customers currently seated</p>
            ) : (
              seatedCustomers.map((customer) => (
                <motion.div
                  key={customer._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{customer.name}</h4>
                        <p className="text-sm text-gray-400">Party of {customer.partySize} • {customer.email}</p>
                        {customer.updatedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Seated: {new Date(customer.updatedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteCustomer(customer.customerId || customer._id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition-all flex items-center gap-2 border border-red-500/30 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Finished
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Peak Hours Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Peak Hours</h3>
            <div style={{ height: '300px' }}>
              <Bar data={peakHoursData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Customers Per Hour */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Customers Per Hour</h3>
            <div style={{ height: '300px' }}>
              <Line data={customersPerHourData} options={chartOptions} />
            </div>
          </motion.div>
        </div>

        {/* Wait Time Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">Average Wait Time Trend</h3>
          <div style={{ height: '300px' }}>
            <Line data={waitTimeData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Queue Throughput */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mt-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-white">Queue Throughput</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-blue-400">{stats.currentQueueLength}</p>
              <p className="text-sm text-gray-400 mt-1">Current Queue Length</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-purple-400">
                {stats.totalServed > 0 ? Math.round((stats.totalParties / stats.totalServed) * 10) / 10 : 0}
              </p>
              <p className="text-sm text-gray-400 mt-1">Throughput Rate</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-green-400">
                {hourlyChartData.length > 0
                  ? Math.max(...hourlyChartData.map(d => d.customers))
                  : 0}
              </p>
              <p className="text-sm text-gray-400 mt-1">Peak Hour Volume</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard