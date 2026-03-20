/**
 * FormCoachOverlay.tsx — Enhancement §7.3
 * Camera-based form feedback bottom sheet with live skeleton overlay.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, AlertCircle } from 'lucide-react'
import { useFormCoach } from '../hooks/useFormCoach'

interface Props {
  exerciseId: string | null
  exerciseName: string
  onClose: () => void
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference
  const color = score >= 80 ? '#00FFC2' : score >= 50 ? '#7B5EFF' : '#FF3D5A'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.08)" />
        <motion.circle
          cx="48" cy="48" r={radius}
          fill="none" strokeWidth="6"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.4 }}
        />
      </svg>
      <motion.span
        key={score}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-mono text-2xl font-bold"
        style={{ color }}
      >
        {score}
      </motion.span>
    </div>
  )
}

export default function FormCoachOverlay({ exerciseId, exerciseName, onClose }: Props) {
  const { videoRef, canvasRef, active, loading, feedback, error, start, stop } = useFormCoach(exerciseId)

  const handleClose = () => {
    stop()
    onClose()
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet — 80% height */}
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col glass rounded-t-3xl overflow-hidden"
        style={{ height: '80dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 rounded-full bg-bear-rim/60 mx-auto mt-3 mb-4 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl text-bear-bright">Form Coach</h2>
            <p className="text-bear-muted text-sm capitalize">{exerciseName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-bear-surface flex items-center justify-center"
          >
            <X size={18} className="text-bear-text" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative flex-1 mx-4 rounded-2xl overflow-hidden bg-black min-h-0">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full scale-x-[-1]"
          />

          {/* Not-started state */}
          {!active && !loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-plasma/20 border border-plasma/30 flex items-center justify-center">
                <Camera size={28} className="text-plasma" />
              </div>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={start}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-plasma to-neon font-display text-white text-lg"
              >
                Start Analysis
              </motion.button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-plasma border-t-transparent rounded-full animate-spin" />
              <p className="text-bear-muted text-sm">Loading model…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <AlertCircle size={32} className="text-ember" />
              <p className="text-bear-text">{error}</p>
              <button onClick={start} className="text-plasma text-sm underline">Retry</button>
            </div>
          )}

          {/* Rep counter badge */}
          {active && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl glass">
              <span className="font-mono text-bear-bright text-sm">
                Reps: <span className="text-neon font-bold">{feedback.reps}</span>
              </span>
            </div>
          )}
        </div>

        {/* Feedback row */}
        <div className="flex items-center gap-4 px-5 py-4 flex-shrink-0">
          <ScoreRing score={active ? feedback.score : 0} />
          <div className="flex-1 min-w-0">
            {active && feedback.issue ? (
              <motion.div
                key={feedback.issue}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="px-3 py-2 rounded-xl bg-ember/15 border border-ember/30 mb-2"
              >
                <p className="text-ember text-sm font-medium">{feedback.issue}</p>
              </motion.div>
            ) : active ? (
              <div className="px-3 py-2 rounded-xl bg-neon/15 border border-neon/30 mb-2">
                <p className="text-neon text-sm font-medium">Form looks good!</p>
              </div>
            ) : null}
            {active && feedback.tip && (
              <p className="text-bear-muted text-xs">{feedback.tip}</p>
            )}
            {!active && !loading && (
              <p className="text-bear-muted text-sm">Point camera at your full body to analyse form in real time.</p>
            )}
          </div>
        </div>

        {/* Stop button */}
        {active && (
          <div className="px-5 pb-6 pb-safe flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={stop}
              className="w-full py-3 rounded-2xl bg-bear-surface border border-bear-rim/50 font-display text-bear-text text-sm"
            >
              Stop Camera
            </motion.button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
