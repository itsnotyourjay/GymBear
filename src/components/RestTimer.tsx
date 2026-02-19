import { useEffect, useRef } from 'react'
import { useWorkoutStore } from '../store/useWorkoutStore'

interface RestTimerProps {
  onComplete?: () => void
}

export default function RestTimer({ onComplete }: RestTimerProps) {
  const { restTimerActive, restTimerSeconds, restTimerTotal, tickRestTimer, stopRestTimer } =
    useWorkoutStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (restTimerActive) {
      intervalRef.current = setInterval(() => {
        tickRestTimer()
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [restTimerActive, tickRestTimer])

  // Fire onComplete when timer hits 0
  useEffect(() => {
    if (restTimerActive && restTimerSeconds === 0) {
      onCompleteRef.current?.()
    }
  }, [restTimerSeconds, restTimerActive])

  if (!restTimerActive && restTimerSeconds === 0) return null

  const progress = restTimerTotal > 0 ? restTimerSeconds / restTimerTotal : 0
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  // Colour: green → yellow → red
  const colour = progress > 0.6 ? '#22c55e' : progress > 0.3 ? '#facc15' : '#ef4444'

  const minutes = Math.floor(restTimerSeconds / 60)
  const secs    = restTimerSeconds % 60

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e2a3a" strokeWidth="8" />
          {/* Progress arc */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={colour}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-2xl text-off-white">
            {minutes > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : `${secs}s`}
          </span>
        </div>
      </div>
      <button
        onClick={stopRestTimer}
        className="text-off-white/50 text-xs hover:text-off-white/80 transition-colors"
      >
        Skip rest
      </button>
    </div>
  )
}
