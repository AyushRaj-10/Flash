import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import { analyticsAPI } from '../utils/api'
import wsClient from '../utils/websocket'

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
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const navigate = useNavigate()

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await analyticsAPI.getStats(dateRange.startDate, dateRange.endDate)
      setStats(response.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('staffToken')) {
      navigate('/staff/login')
      return
    }

    loadAnalytics()

    // Listen for real-time updates
    const handlePartyAdmitted = () => {
      loadAnalytics()
    }

    wsClient.on('PARTY_ADMITTED', handlePartyAdmitted)

    return () => {
      wsClient.off('PARTY_ADMITTED', handlePartyAdmitted)
    }
  }, [navigate, dateRange.startDate, dateRange.endDate])

  const handleDateChange = (field, value) => {
    setDateRange({ ...dateRange, [field]: value })
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  // Prepare hourly data for charts
  const hourlyChartData = Object.entries(stats.hourlyData || {})
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      hourNum: parseInt(hour),
      customers: count
    }))
    .sort((a, b) => a.hourNum - b.hourNum)

  // Chart.js data for Peak Hours (Bar Chart)
  const peakHoursData = {
    labels: hourlyChartData.map(item => item.hour),
    datasets: [
      {
        label: 'Parties Served',
        data: hourlyChartData.map(item => item.customers),
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
    labels: hourlyChartData.map(item => item.hour),
    datasets: [
      {
        label: 'Customers',
        data: hourlyChartData.map(item => item.customers),
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
    labels: hourlyChartData.map(item => item.hour),
    datasets: [
      {
        label: 'Avg Wait Time (min)',
        data: hourlyChartData.map(() => stats.averageWaitTime),
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
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      }
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Restaurant performance insights</p>
          </motion.div>
          <div className="flex gap-4">
            <motion.button
              onClick={() => navigate('/staff/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Dashboard
            </motion.button>
            <motion.button
              onClick={() => {
                localStorage.removeItem('staffToken')
                navigate('/staff/login')
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-8 shadow-xl"
        >
          <h3 className="text-lg font-semibold mb-4">Date Range</h3>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <motion.button
                onClick={loadAnalytics}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Apply Filter
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
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Total Served</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalServed}</p>
            <p className="text-xs text-gray-500 mt-1">Parties seated</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalParties}</p>
            <p className="text-xs text-gray-500 mt-1">Individual diners</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Avg Party Size</p>
            <p className="text-3xl font-bold text-green-600">{stats.averagePartySize}</p>
            <p className="text-xs text-gray-500 mt-1">People per party</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Avg Wait Time</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.averageWaitTime} min</p>
            <p className="text-xs text-gray-500 mt-1">Current average</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Peak Hours Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Peak Hours</h3>
            <div style={{ height: '300px' }}>
              <Bar data={peakHoursData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Customers Per Hour */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Customers Per Hour</h3>
            <div style={{ height: '300px' }}>
              <Line data={customersPerHourData} options={chartOptions} />
            </div>
          </motion.div>
        </div>

        {/* Wait Time Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Average Wait Time Trend</h3>
          <div style={{ height: '300px' }}>
            <Line data={waitTimeData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Queue Throughput */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass rounded-2xl p-6 shadow-xl mt-6"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Queue Throughput</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.currentQueueLength}</p>
              <p className="text-sm text-gray-600 mt-1">Current Queue Length</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalServed > 0 ? Math.round((stats.totalParties / stats.totalServed) * 10) / 10 : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Throughput Rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {hourlyChartData.length > 0
                  ? Math.max(...hourlyChartData.map(d => d.customers))
                  : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Peak Hour Volume</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
