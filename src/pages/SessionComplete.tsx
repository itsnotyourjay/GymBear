import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Clock, Weight, ChevronRight } from 'lucide-react'
import type { WorkoutSession } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { saveSession, loadPR, savePR, saveStreak, loadStreak, loadAllSessions, type SessionData } from '../lib/storage'
import { getExerciseById } from '../data/exercises'
import Bruno from '../components/Bruno'

function fireConfetti() {
  try {
    const end = Date.now() + 1200
    const frame = () => {
      // simple CSS-only flash fallback (canvas-confetti not installed)
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  } catch { /* ignore */ }
}

interface Props {
  session: WorkoutSession
}

export default function SessionComplete({ session }: Props) {
  const navigate           = useNavigate()
  const addBrunoXP         = useGymBearStore((s) => s.addBrunoXP)
  const bruno              = useGymBearStore((s) => s.bruno)
  const setBrunoAnimation  = useGymBearStore((s) => s.setBrunoAnimation)
  const [prs, setPRs]      = useState<string[]>([])
  const [saved, setSaved]  = useState(false)
  const hasSaved           = useRef(false)

  const durationSeconds = session.startTime
    ? Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000)
    : 0

  const totalSets   = session.exercises.reduce((a, ex) => a + ex.completed.length, 0)
  const totalVolume = session.exercises.reduce(
    (a, ex) => a + ex.completed.reduce((b, s) => b + s.weight * s.reps, 0),
    0
  )

  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true

    const save = async () => {
      const date = session.date

      // Detect PRs
      const newPRs: string[] = []
      for (const ex of session.exercises) {
        const exercise = getExerciseById(ex.exerciseId)
        if (!exercise) continue
        for (const set of ex.completed) {
          const existingPR = loadPR(ex.exerciseId)
          if (!existingPR || set.weight > existingPR.bestWeight) {
            await savePR(ex.exerciseId, { bestWeight: set.weight, bestReps: set.reps, date })
            if (!newPRs.includes(exercise.name)) newPRs.push(exercise.name)
          }
        }
      }
      setPRs(newPRs)
      if (newPRs.length > 0) {
        fireConfetti()
        setBrunoAnimation('pr-achieved')
      } else {
        setBrunoAnimation('session-complete')
      }

      // Build session data for storage
      const exerciseIds = session.exercises.map((ex) => ex.exerciseId)
      const sets = session.exercises.map((ex) => ex.completed.map((_, i) => i + 1))
      const reps = session.exercises.map((ex) => ex.completed.map((s) => s.reps))
      const weights = session.exercises.map((ex) => ex.completed.map((s) => s.weight))

      const sessionData: SessionData = {
        exercises: exerciseIds,
        sets:      sets,
        reps,
        weights,
        duration: durationSeconds,
        note:     session.note ?? '',
        timestamp: new Date().toISOString(),
      }

      await saveSession(date, sessionData)

      // Update streak
      const current = loadStreak()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yISO = yesterday.toISOString().split('T')[0]
      const wasYesterday = loadAllSessions().some(({ date: d }: { date: string }) => d === yISO)
      const newCurrent = wasYesterday || current.current === 0 ? current.current + 1 : 1
      const newBest    = Math.max(newCurrent, current.best)
      await saveStreak(newCurrent, newBest)

      // Award Bruno XP: 50 base + 10 per PR
      addBrunoXP(50 + newPRs.length * 10)
      setSaved(true)
    }

    save()
  }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center px-6 py-12">
      {/* Bruno celebration */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-2"
      >
        <Bruno
          state={prs.length > 0 ? 'pr-achieved' : 'session-complete'}
          accessory={bruno.activeAccessory}
          level={bruno.level}
          size={120}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-heading text-5xl text-off-white mb-1 tracking-wide"
      >
        SESSION DONE!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-off-white/50 mb-8 text-sm"
      >
        {saved ? 'Saved to your history' : 'Saving…'}
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full grid grid-cols-2 gap-3 mb-6"
      >
        <StatCard Icon={Clock}   label="Duration"    value={formatDuration(durationSeconds)} />
        <StatCard Icon={Zap}     label="Sets"        value={String(totalSets)} />
        <StatCard Icon={Weight}  label="Volume"      value={`${Math.round(totalVolume).toLocaleString()} kg`} />
        <StatCard Icon={Trophy}  label="PRs"         value={String(prs.length)} accent={prs.length > 0} />
      </motion.div>

      {/* PR badges */}
      <AnimatePresence>
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-gold font-bold text-sm mb-2">
              <Trophy size={16} /> New Personal Records!
            </div>
            {prs.map((name) => (
              <div key={name} className="text-gold/80 text-sm">🏆 {name}</div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate('/home')}
        className="w-full bg-red-elec text-off-white font-bold py-4 rounded-xl
          flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        Back to Home <ChevronRight size={18} />
      </motion.button>
    </div>
  )
}

function StatCard({
  Icon, label, value, accent = false,
}: {
  Icon: React.ElementType
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'bg-gold/10 border border-gold/20' : 'bg-blue-dark/40'}`}>
      <Icon size={16} className={accent ? 'text-gold mb-2' : 'text-off-white/40 mb-2'} />
      <div className={`font-heading text-2xl ${accent ? 'text-gold' : 'text-off-white'}`}>{value}</div>
      <div className="text-off-white/40 text-xs mt-0.5">{label}</div>
    </div>
  )
}
