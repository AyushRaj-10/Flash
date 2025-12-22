import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { staffAPI } from '../utils/api'
import wsClient from '../utils/websocket'

function StaffDashboard() {
  const [queue, setQueue] = useState([])
  const [queueLength, setQueueLength] = useState(0)
  const [nextParty, setNextParty] = useState(null)
  const [loading, setLoading] = useState(false)
  const [skipModal, setSkipModal] = useState({ open: false, partyId: null, reason: '' })
  const navigate = useNavigate()

  useEffect(() => {
    // Check authentication
    if (!localStorage.getItem('staffToken')) {
      navigate('/staff/login')
      return
    }

    // Connect WebSocket
    wsClient.connect()
    
    // Listen for updates
    wsClient.on('QUEUE_UPDATED', handleQueueUpdate)
    wsClient.on('PARTY_ADMITTED', handleQueueUpdate)
    wsClient.on('INITIAL_STATE', handleQueueUpdate)

    // Load initial state
    loadQueueStatus()
    loadNextParty()

    return () => {
      wsClient.off('QUEUE_UPDATED', handleQueueUpdate)
      wsClient.off('PARTY_ADMITTED', handleQueueUpdate)
      wsClient.off('INITIAL_STATE', handleQueueUpdate)
    }
  }, [navigate])

  const loadQueueStatus = async () => {
    try {
      const response = await staffAPI.getNext()
      const statusResponse = await fetch('http://localhost:5000/api/queue/status')
      const statusData = await statusResponse.json()
      setQueue(statusData.queue)
      setQueueLength(statusData.queueLength)
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

  const handleQueueUpdate = (data) => {
    if (data.queue) {
      setQueue(data.queue)
      setQueueLength(data.queueLength)
    }
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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to admit party')
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
    ? Math.round(queue.reduce((sum, item) => sum + item.estimatedWaitTime, 0) / queue.length)
    : 0

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
              Staff Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage restaurant queue</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Queue Length</p>
            <p className="text-3xl font-bold text-blue-600">{queueLength}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Avg Wait Time</p>
            <p className="text-3xl font-bold text-purple-600">{averageWaitTime} min</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Next Party</p>
            <p className="text-3xl font-bold text-green-600">
              {nextParty ? nextParty.partySize : '—'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 shadow-xl"
          >
            <p className="text-gray-600 text-sm mb-2">Status</p>
            <p className="text-3xl font-bold text-indigo-600">
              {queueLength > 0 ? 'Active' : 'Empty'}
            </p>
          </motion.div>
        </div>

        {/* Next Party Action */}
        {nextParty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 mb-8 border-2 border-blue-200 shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Next Party to Seat</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-800">{nextParty.name}</p>
                <p className="text-gray-600">Party of {nextParty.partySize}</p>
                {nextParty.phoneNumber && (
                  <p className="text-gray-500 text-sm mt-1">📞 {nextParty.phoneNumber}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Joined: {new Date(nextParty.joinedAt).toLocaleTimeString()}
                </p>
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

        {/* Queue List */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Waiting Queue (FIFO Order)</h2>
          
          {queue.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
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
                    className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${
                      index === 0 ? 'border-green-500 bg-green-50' : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`text-4xl font-bold ${
                          index === 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          #{party.position}
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-gray-800">{party.name}</p>
                          <p className="text-gray-600">Party of {party.partySize}</p>
                          {party.phoneNumber && (
                            <p className="text-gray-500 text-sm mt-1">📞 {party.phoneNumber}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Est. wait: {party.estimatedWaitTime} min
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
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                          >
                            Seat Now
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => setSkipModal({ open: true, partyId: party._id || party.id, reason: '' })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
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
        </div>
      </div>

      {/* Skip Modal */}
      <AnimatePresence>
        {skipModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSkipModal({ open: false, partyId: null, reason: '' })}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-semibold mb-4">Skip Party</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={skipModal.reason}
                  onChange={(e) => setSkipModal({ ...skipModal, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Confirm Skip
                </motion.button>
                <motion.button
                  onClick={() => setSkipModal({ open: false, partyId: null, reason: '' })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
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
