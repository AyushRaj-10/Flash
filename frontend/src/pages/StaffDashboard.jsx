import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
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
import { Trash2, Users, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { staffAPI, queueAPI } from '../utils/api'
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

function StaffDashboard() {
  const [queue, setQueue] = useState([])
  const [queueLength, setQueueLength] = useState(0)
  const [seated, setSeated] = useState([])
  const [nextParty, setNextParty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [skipModal, setSkipModal] = useState({ open: false, partyId: null, reason: '' })
  const navigate = useNavigate()

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect()
    
    // Listen for updates
    wsClient.on('QUEUE_UPDATED', handleQueueUpdate)
    wsClient.on('PARTY_ADMITTED', handleQueueUpdate)
    wsClient.on('INITIAL_STATE', handleQueueUpdate)
    
    // Listen for seated updates
    wsClient.on('SEATED_UPDATED', handleSeatedUpdate)

    // Load initial state
    loadQueueStatus()
    loadSeatedCustomers()
    loadNextParty()

    return () => {
      wsClient.off('QUEUE_UPDATED', handleQueueUpdate)
      wsClient.off('PARTY_ADMITTED', handleQueueUpdate)
      wsClient.off('INITIAL_STATE', handleQueueUpdate)
      wsClient.off('SEATED_UPDATED', handleSeatedUpdate)
    }
  }, [navigate])

  const loadQueueStatus = async () => {
    try {
      const response = await queueAPI.getStatus()
      setQueue(response.data.queue)
      setQueueLength(response.data.queueLength)
    } catch (error) {
      console.error('Error loading queue:', error)
    }
  }

  const loadNextParty = async () => {
    try {
      const response = await staffAPI.getNext()
      setNextParty(response.data.nextParty)
    } catch (error) {
      console.error('Error loading next party:', error)
    }
  }

  const loadSeatedCustomers = async () => {
    try {
      const response = await queueAPI.getSeated()
      // Ensure all customers have both customerId and _id for consistent ID matching
      const formattedSeated = (response.data || []).map(customer => ({
        ...customer,
        customerId: customer.customerId || customer._id,
        _id: customer._id || customer.customerId,
      }))
      setSeated(formattedSeated)
    } catch (error) {
      console.error('Error loading seated customers:', error)
    }
  }

  const handleSeatedUpdate = (data) => {
    // Backend sends array of seated customers
    const seatedList = Array.isArray(data) ? data : []
    // Ensure all customers have both customerId and _id for consistent ID matching
    const formattedSeated = seatedList.map(customer => ({
      ...customer,
      customerId: customer.customerId || customer._id,
      _id: customer._id || customer.customerId,
    }))
    setSeated(formattedSeated)
  }

  const handleQueueUpdate = (data) => {
    // Backend sends array directly, format it
    const queue = Array.isArray(data) ? data : (data.queue || [])
    const formattedQueue = queue.map((customer, index) => ({
      ...customer,
      position: index + 1,
      id: customer.customerId || customer._id,
      _id: customer._id || customer.customerId,
    }))
    
    setQueue(formattedQueue)
    setQueueLength(formattedQueue.length)
    loadNextParty()
  }

  const handleAdmitNext = async () => {
    if (!nextParty) {
      toast.error('No party in queue')
      return
    }

    setLoading(true)
    try {
      await staffAPI.admitNext()
      toast.success(`${nextParty.name} has been seated!`)
      loadNextParty()
      loadSeatedCustomers() // Reload seated customers after seating someone
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to admit party')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkFinished = async (customerId) => {
    console.log('handleMarkFinished called with customerId:', customerId)
    
    // Confirm deletion
    if (!window.confirm('Are you sure this customer has finished eating? This will permanently remove them from the database.')) {
      return
    }

    // Store the customer being removed in case we need to restore on error
    const customerToRemove = seated.find(c => {
      const cId = c.customerId || c._id
      return cId === customerId || cId?.toString() === customerId?.toString()
    })
    
    if (!customerToRemove) {
      console.error('Customer not found in seated list:', customerId)
      toast.error('Customer not found')
      return
    }
    
    if (!customerToRemove.email) {
      console.error('Customer email not found:', customerToRemove)
      toast.error('Customer email not found, cannot delete')
      return
    }
    
    console.log('Removing customer:', customerToRemove.name, 'email:', customerToRemove.email)
    
    // Optimistically remove from frontend immediately for instant UI feedback
    setSeated(prevSeated => prevSeated.filter(c => {
      const cId = c.customerId || c._id
      return cId !== customerId && cId?.toString() !== customerId?.toString()
    }))
    
    setLoading(true)
    try {
      // Use email to delete as per new backend logic
      console.log('Calling API to delete with email:', customerToRemove.email)
      
      // Call backend API to permanently delete from database using email
      const response = await queueAPI.deleteByEmail(customerToRemove.email)
      console.log('Delete response:', response.data)
      
      // Verify deletion was successful
      if (response.data && response.data.message) {
        toast.success(response.data.message)
      } else {
        toast.success('Customer successfully removed from database')
      }
      
      // WebSocket will update the list automatically, but reload as backup
      // This ensures the frontend state matches the database state
      loadSeatedCustomers()
      
      // Also reload queue status to update stats
      loadQueueStatus()
    } catch (error) {
      console.error('Error deleting customer:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // If error, restore the customer back to the list since deletion failed
      if (customerToRemove) {
        setSeated(prevSeated => {
          // Check if customer is already in the list
          const exists = prevSeated.some(c => {
            const cId = c.customerId || c._id
            return cId === customerToRemove.customerId || cId === customerToRemove._id
          })
          return exists ? prevSeated : [...prevSeated, customerToRemove]
        })
      } else {
        // If we can't restore, reload from server to get accurate state
        loadSeatedCustomers()
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to remove customer from database'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!skipModal.partyId) return

    setLoading(true)
    try {
      await staffAPI.skip(skipModal.partyId, skipModal.reason)
      toast.success('Party skipped')
      setSkipModal({ open: false, partyId: null, reason: '' })
      loadNextParty()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to skip party')
    } finally {
      setLoading(false)
    }
  }

  const averageWaitTime = queue.length > 0
    ? Math.round(queue.reduce((sum, item, index) => sum + (item.estimatedWaitTime || (index + 1) * 15), 0) / queue.length)
    : 0

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
              Staff Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage restaurant queue</p>
          </motion.div>
          <div className="flex gap-4">
            <motion.button
              onClick={() => navigate('/staff/analytics')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Analytics
            </motion.button>
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Back to Home
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Queue Length</p>
              <Users className="text-blue-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-blue-400">{queueLength}</p>
            <p className="text-xs text-gray-400 mt-1">Parties waiting</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Avg Wait Time</p>
              <Clock className="text-purple-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-purple-400">{averageWaitTime} min</p>
            <p className="text-xs text-gray-400 mt-1">Estimated</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Next Party</p>
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-400">
              {nextParty ? nextParty.partySize : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Party size</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-300 text-sm">Seated</p>
              <CheckCircle className="text-indigo-400" size={24} />
            </div>
            <p className="text-3xl font-bold text-indigo-400">{seated.length}</p>
            <p className="text-xs text-gray-400 mt-1">Currently dining</p>
          </motion.div>
        </div>

        {/* Next Party Action */}
        {nextParty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl border border-green-400/30"
          >
            <h2 className="text-2xl font-semibold mb-4 text-white">Next Party to Seat</h2>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {nextParty.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{nextParty.name}</p>
                  <p className="text-gray-300">Party of {nextParty.partySize}</p>
                  {nextParty.email && (
                    <p className="text-gray-400 text-sm mt-1">📧 {nextParty.email}</p>
                  )}
                  {nextParty.createdAt && (
                    <p className="text-sm text-gray-400 mt-1">
                      Joined: {new Date(nextParty.createdAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={handleAdmitNext}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Seating...' : 'Seat Party'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Seated Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
            <CheckCircle size={28} className="text-green-400" />
            Seated Customers ({seated.length})
          </h2>
          
          {seated.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-xl">No customers currently seated</p>
              <p className="text-sm mt-2">Seat customers from the queue below</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {seated.map((customer) => (
                  <motion.div
                    key={customer._id || customer.customerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{customer.name}</p>
                          <p className="text-gray-300">Party of {customer.partySize}</p>
                          {customer.email && (
                            <p className="text-gray-400 text-sm mt-1">📧 {customer.email}</p>
                          )}
                          {customer.updatedAt && (
                            <p className="text-sm text-gray-400 mt-1">
                              Seated: {new Date(customer.updatedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <motion.button
                        onClick={() => {
                          const customerId = customer.customerId || customer._id
                          console.log('Delete button clicked for customer:', customer.name, 'ID:', customerId)
                          handleMarkFinished(customerId)
                        }}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 border border-red-500/30"
                      >
                        <Trash2 size={18} />
                        {loading ? 'Removing...' : 'Has Eaten'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Queue List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20"
        >
          <h2 className="text-2xl font-semibold mb-6 text-white">Waiting Queue (FIFO Order)</h2>
          
          {queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-xl">Queue is empty</p>
              <p className="text-sm mt-2">No parties waiting</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {queue.map((party, index) => (
                  <motion.div
                    key={party.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition-all ${
                      index === 0 ? 'border-green-400/50 bg-green-400/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                          index === 0 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                            : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                        }`}>
                          #{party.position}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{party.name}</p>
                          <p className="text-gray-300">Party of {party.partySize}</p>
                          {party.email && (
                            <p className="text-gray-400 text-sm mt-1">📧 {party.email}</p>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            Est. wait: {party.estimatedWaitTime || (party.position * 15)} min
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {index === 0 && (
                          <motion.button
                            onClick={handleAdmitNext}
                            disabled={loading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                          >
                            Seat Now
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => setSkipModal({ open: true, partyId: party._id || party.id, reason: '' })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all border border-red-500/30"
                        >
                          Skip
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Skip Modal */}
      <AnimatePresence>
        {skipModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSkipModal({ open: false, partyId: null, reason: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20"
            >
              <h3 className="text-2xl font-semibold mb-4 text-white">Skip Party</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={skipModal.reason}
                  onChange={(e) => setSkipModal({ ...skipModal, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Enter reason for skipping..."
                />
              </div>
              <div className="flex gap-4">
                <motion.button
                  onClick={handleSkip}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Skipping...' : 'Confirm Skip'}
                </motion.button>
                <motion.button
                  onClick={() => setSkipModal({ open: false, partyId: null, reason: '' })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all border border-white/20"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffDashboard