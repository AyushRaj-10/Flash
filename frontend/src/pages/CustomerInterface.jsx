import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { queueAPI } from '../utils/api'
import wsClient from '../utils/websocket'

function CustomerInterface() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', partySize: '', email: '' })
  const [party, setParty] = useState(null)
  const [queueStatus, setQueueStatus] = useState({ queue: [], queueLength: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect()
    
    // Listen for queue updates
    wsClient.on('QUEUE_UPDATED', handleQueueUpdate)
    wsClient.on('PARTY_ADMITTED', handleQueueUpdate)
    wsClient.on('INITIAL_STATE', handleQueueUpdate)

    // Load initial queue status
    loadQueueStatus()

    return () => {
      wsClient.off('QUEUE_UPDATED', handleQueueUpdate)
      wsClient.off('PARTY_ADMITTED', handleQueueUpdate)
      wsClient.off('INITIAL_STATE', handleQueueUpdate)
      wsClient.disconnect()
    }
  }, [])

  const loadQueueStatus = async () => {
    try {
      const response = await queueAPI.getStatus()
      setQueueStatus(response.data)
    } catch (error) {
      console.error('Error loading queue status:', error)
    }
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
    
    setQueueStatus({
      queue: formattedQueue,
      queueLength: formattedQueue.length,
    })
    
    // Update party position if in queue
    if (party) {
      const partyId = party.customerId || party._id || party.id
      const updatedParty = formattedQueue.find(p => {
        const pId = p.customerId || p._id || p.id
        return pId === partyId
      })
      
      if (updatedParty) {
        setParty(updatedParty)
        
        // Notify when 1-2 positions away
        if (updatedParty.position <= 2 && updatedParty.position > 0) {
          toast.success(`You're almost there! Position #${updatedParty.position}`, {
            duration: 5000,
            icon: '🎉',
          })
        }
      } else if (party.position && party.position <= 2) {
        // Party was seated or removed
        toast.success('Your table is ready! Please proceed to the restaurant.', {
          duration: 10000,
          icon: '🎊',
        })
        setParty(null)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Backend requires: id, name, partySize, email
      const joinData = {
        ...formData,
        partySize: parseInt(formData.partySize), // Ensure it's a number
      }
      const response = await queueAPI.join(joinData)
      const customer = response.data.customer
      const position = response.data.position
      
      // Format party data to match frontend expectations
      // Include customerId for cancel functionality
      const partyData = {
        ...customer,
        position: position,
        customerId: customer.customerId || customer._id, // Primary identifier for cancel
        id: customer.customerId || customer._id,
        _id: customer._id || customer.customerId,
        estimatedWaitTime: position * 15, // Estimate 15 min per party
      }
      
      setParty(partyData)
      toast.success(`You're #${position} in the queue!`)
      setFormData({ name: '', partySize: '', email: '' })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join queue')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!party) return

    try {
      // Use customerId first (primary identifier), then fallback to _id or id
      const partyId = party.customerId || party._id || party.id
      await queueAPI.cancel(partyId)
      toast.success('You have been removed from the queue')
      setParty(null)
      // Reload queue status to reflect the change
      loadQueueStatus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel')
    }
  }

  const partiesAhead = party ? party.position - 1 : 0
  const progress = party && queueStatus.queueLength > 0 
    ? ((queueStatus.queueLength - partiesAhead) / queueStatus.queueLength) * 100 
    : 0

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back to Home</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent mb-2">
            Smart Restaurant Queue
          </h1>
          <p className="text-gray-600 text-lg">Join our virtual waiting line</p>
        </motion.div>

        {!party ? (
          /* Join Queue Form */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Join the Queue</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black placeholder:text-gray-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Size *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black placeholder:text-gray-500"
                  placeholder="Number of people"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black placeholder:text-gray-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-900 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Queue'}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          /* Queue Status */
          <AnimatePresence mode="wait">
            <motion.div
              key="queue-status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-block mb-4"
                >
                  <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    #{party.position}
                  </div>
                </motion.div>
                <p className="text-2xl font-semibold text-gray-800 mb-2">
                  {party.name}
                </p>
                <p className="text-gray-600">
                  Party of {party.partySize} • {partiesAhead} {partiesAhead === 1 ? 'party' : 'parties'} ahead
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Your Position</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-700 to-pink-500 rounded-full"
                  />
                </div>
              </div>

              {/* Estimated Wait Time */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 rounded-2xl p-6 mb-6 border border-blue-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Wait Time</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {party.estimatedWaitTime || (partiesAhead * 15)} min
                    </p>
                  </div>
                  <div className="text-4xl">⏱️</div>
                </div>
              </motion.div>

              {/* Cancel Button */}
              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              >
                Cancel Queue Entry
              </motion.button>

              {/* Live Updates Indicator */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <span>Live updates enabled</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Queue Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-gray-600"
        >
          <p>Total parties in queue: <span className="font-semibold">{queueStatus.queueLength}</span></p>
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerInterface

