import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGymBearStore } from '../store/useGymBearStore'
import { verifyPIN } from '../lib/pin'

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

export default function PinLock() {
  const navigate = useNavigate()
  const userProfile = useGymBearStore((s) => s.userProfile)

  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [shake, setShake]   = useState(false)

  // If no profile / no PIN hash set, skip to onboarding
  useEffect(() => {
    if (!userProfile?.pinHash) {
      navigate('/onboarding', { replace: true })
    }
  }, [userProfile, navigate])

  const handleKey = async (key: string) => {
    setError('')
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    const next = pin + key
    setPin(next)

    // Auto-check when we have ≥4 digits
    if (next.length >= 4) {
      const ok = await verifyPIN(next, userProfile!.pinHash ?? '')
      if (ok) {
        navigate('/home', { replace: true })
      } else if (next.length >= 6) {
        setError('Wrong PIN')
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPin('')
        }, 600)
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      {/* Logo/Title */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-5xl text-off-white tracking-wider">GYMBEAR</h1>
        <p className="text-off-white/50 mt-1">Enter your PIN</p>
      </div>

      {/* PIN dots */}
      <AnimatePresence>
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex gap-4 mb-4"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length ? 'bg-red-elec border-red-elec scale-110' : 'bg-transparent border-off-white/30'
              }`}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="text-red-elec text-sm mb-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
        {KEYPAD.flat().map((key, i) =>
          key === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl bg-blue-dark/40 text-off-white font-bold text-2xl
                active:scale-90 transition-transform hover:bg-blue-dark/70 select-none"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          )
        )}
      </div>
    </div>
  )
}
