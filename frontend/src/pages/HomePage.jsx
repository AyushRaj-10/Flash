import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Spline from '@splinetool/react-spline'
import { useState } from 'react'

function HomePage() {
  const navigate = useNavigate()
  const [splineLoaded, setSplineLoaded] = useState(false)

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Spline 3D Scene - Full Page Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Spline
          scene="https://prod.spline.design/R5lk9TzCT-MU0T2k/scene.splinecode"
          onLoad={() => setSplineLoaded(true)}
          className="w-full h-full"
        />
        {/* Loading overlay */}
        {!splineLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading 3D Experience...</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Header with Title and Buttons */}
      <div className="relative z-20 w-full">
        <div className="flex justify-between items-start p-6">
          {/* Title - Top Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              Smart Restaurant Queue
            </h1>
            <p className="text-lg md:text-xl text-gray-700 font-medium">
              Experience Seamless Dining
            </p>
          </motion.div>

          {/* Action Buttons - Top Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Join Queue Button */}
            <motion.button
              onClick={() => navigate('/queue/join')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[160px]"
            >
              <span className="text-xl">🍽️</span>
              <span>Join Queue</span>
            </motion.button>

            {/* Staff Login Button */}
            <motion.button
              onClick={() => navigate('/staff/login')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass rounded-xl px-6 py-3 bg-white/90 backdrop-blur-lg border-2 border-purple-200 text-purple-700 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[160px] hover:bg-white"
            >
              <span className="text-xl">👨‍🍳</span>
              <span>Staff Login</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Features - Bottom */}
      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mx-auto z-20"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass rounded-xl p-6 text-center backdrop-blur-lg bg-white/70"
          >
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-800 mb-2">Real-Time Updates</h3>
            <p className="text-sm text-gray-600">Track your position live</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass rounded-xl p-6 text-center backdrop-blur-lg bg-white/70"
          >
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-800 mb-2">Mobile Friendly</h3>
            <p className="text-sm text-gray-600">Join from anywhere</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass rounded-xl p-6 text-center backdrop-blur-lg bg-white/70"
          >
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-800 mb-2">Fast & Efficient</h3>
            <p className="text-sm text-gray-600">No more waiting in line</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl z-0"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl z-0"></div>
    </div>
  )
}

export default HomePage
