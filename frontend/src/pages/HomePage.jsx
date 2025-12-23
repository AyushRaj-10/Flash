import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import Spline from '@splinetool/react-spline'
import { Clock, MapPin, Users, QrCode, Radio, Bell } from 'lucide-react'

function HomePage() {
  const navigate = useNavigate()
  const [splineLoaded, setSplineLoaded] = useState(false)

  // Memoize star positions to avoid re-rendering
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.5 + 0.2
    }))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Spline 3D Scene - Background */}
      <div className="fixed inset-0 w-full h-full z-0" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full opacity-50">
          <Spline
            scene="https://prod.spline.design/R5lk9TzCT-MU0T2k/scene.splinecode"
            onLoad={() => setSplineLoaded(true)}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {/* Loading overlay */}
        {!splineLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 font-semibold">Loading 3D Experience...</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Animated background with stars */}
      <div className="fixed inset-0 overflow-hidden z-0" style={{ pointerEvents: 'none' }}>
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              opacity: star.opacity
            }}
          />
        ))}
      </div>

      {/* Decorative wavy line */}
      <div className="fixed bottom-0 left-0 right-0 h-1/3 opacity-30 z-0" style={{ pointerEvents: 'none' }}>
        <svg viewBox="0 0 1200 300" className="w-full h-full">
          <path
            d="M0,150 Q300,50 600,150 T1200,150 L1200,300 L0,300 Z"
            fill="url(#waveGradient)"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          {/* Logo and Tagline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              FlowDine
            </h1>
            <p className="text-lg text-gray-400 font-light">Experience Seamless Dining</p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-4"
          >
            <motion.button
              onClick={() => navigate('/queue/join')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <QrCode size={20} />
              Join the Queue
            </motion.button>
            <motion.button
              onClick={() => navigate('/staff/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/50 text-gray-200 font-semibold rounded-lg hover:bg-gray-800/70 transition-all"
            >
              Staff Dashboard
            </motion.button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-20 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Stop Waiting.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Start Dining
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed max-w-3xl mx-auto font-light">
            The intelligent queue management system that turns "How long?" into "Your table is ready." FlowDine bridges hungry guests and busy kitchens.
          </p>
          <p className="text-lg text-gray-500 font-medium">
            Trusted by 500+ forward-thinking restaurants
          </p>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Live Transparency */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -5 }}
            className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all"
          >
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Clock className="text-blue-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Live Transparency</h3>
            <p className="text-gray-400 leading-relaxed">
              Never guess your wait time again. Watch your place move forward with real-time and accurate precision. Total peace of mind, no phone.
            </p>
          </motion.div>

          {/* Freedom to Wander */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ y: -5 }}
            className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all"
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="text-purple-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Freedom to Wander</h3>
            <p className="text-gray-400 leading-relaxed">
              Don't get stuck in any waiting room or crowded area. We'll notify you the moment your table is prepping.
            </p>
          </motion.div>

          {/* Zero-Friction Seating */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            whileHover={{ y: -5 }}
            className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all"
          >
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="text-green-400" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Zero-Friction Seating</h3>
            <p className="text-gray-400 leading-relaxed">
              Our smart pacing engine helps staff clear and prep fastest. We'll have less idle time and table waiting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-6xl mx-auto">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-5xl md:text-6xl font-bold text-center mb-16"
        >
          How it Works
        </motion.h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Step 1: Scan & Join */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <QrCode className="text-blue-400" size={40} />
            </div>
            <h4 className="text-2xl font-bold mb-4 text-white">
              1. Scan & Join: Guests
            </h4>
            <p className="text-gray-400 leading-relaxed">
              QR code to virtual line. Virtual queue on the head instantly.
            </p>
          </motion.div>

          {/* Step 2: Live Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Radio className="text-purple-400" size={40} />
            </div>
            <h4 className="text-2xl font-bold mb-4 text-white">
              2. Live Tracking: Guests
            </h4>
            <p className="text-gray-400 leading-relaxed">
              Relax while tracking their status on mobile browser.
            </p>
          </motion.div>

          {/* Step 3: Instant Notification */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bell className="text-green-400" size={40} />
            </div>
            <h4 className="text-2xl font-bold mb-4 text-white">
              3. Instant Notification
            </h4>
            <p className="text-gray-400 leading-relaxed">
              An automated SMS or alert tells them to head to the host stand.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-20"></div>
    </div>
  )
}

export default HomePage
