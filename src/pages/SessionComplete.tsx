import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Zap, Clock, Weight, ChevronRight, Share2 } from 'lucide-react'
import { useWorkoutStore } from '../store/useWorkoutStore'
import type { WorkoutSession } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { saveSession, loadPR, savePR, saveStreak, loadStreak, loadAllSessions, type SessionData } from '../lib/storage'
import { getExerciseById } from '../data/exercises'
import Bruno from '../components/Bruno'
import Confetti from '../components/Confetti'

export default function SessionComplete() {
  const activeSession      = useWorkoutStore((s) => s.activeSession)
  const navigate           = useNavigate()
  const addBrunoXP         = useGymBearStore((s) => s.addBrunoXP)
  const bruno              = useGymBearStore((s) => s.bruno)
  const setBrunoAnimation  = useGymBearStore((s) => s.setBrunoAnimation)
  const [prs, setPRs]      = useState<string[]>([])
  const [saved, setSaved]  = useState(false)
  const hasSaved           = useRef(false)

  const session = activeSession as WorkoutSession

  const durationSeconds = session?.startTime
    ? Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000)
    : 0

  const totalSets   = session?.exercises.reduce((a, ex) => a + ex.completed.length, 0) ?? 0
  const totalVolume = session?.exercises.reduce(
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

  const handleShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'GymBear Session',
        text: `Just crushed a ${formatDuration(durationSeconds)} workout! ${totalSets} sets · ${Math.round(totalVolume).toLocaleString()}kg volume${prs.length > 0 ? ` · ${prs.length} PR(s)` : ''} 🐻🔥`,
      })
    } catch { /* user dismissed */ }
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center px-6 pt-12 pb-10">
      {/* Confetti burst when PRs */}
      {prs.length > 0 && <Confetti count={80} origin={{ x: 0.5, y: 0.3 }} />}

      {/* Bruno celebration */}
      <motion.div
        initial={{ scale: 0, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-3"
      >
        <Bruno
          state={prs.length > 0 ? 'pr-achieved' : 'session-complete'}
          accessory={bruno.activeAccessory}
          level={bruno.level}
          size={120}
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 180 }}
        className="font-display text-7xl text-bear-bright mb-1 tracking-wider text-center glow-ember"
        style={{ textShadow: '0 0 30px rgba(255,61,90,0.5)' }}
      >
        SESSION COMPLETE
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-bear-muted mb-8 text-sm"
      >
        {saved ? 'Saved to your history' : 'Saving…'}
      </motion.p>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="w-full grid grid-cols-2 gap-3 mb-6"
      >
        <StatCard Icon={Clock}   label="Duration"    value={formatDuration(durationSeconds)} />
        <StatCard Icon={Zap}     label="Sets"        value={String(totalSets)} />
        <StatCard Icon={Weight}  label="Volume"      value={`${Math.round(totalVolume).toLocaleString()} kg`} />
        <StatCard Icon={Trophy}  label="PRs"         value={String(prs.length)} accent={prs.length > 0} />
      </motion.div>

      {/* PR cards */}
      <AnimatePresence>
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 160 }}
            className="w-full glass border border-gold/30 p-4 mb-6 glow-gold"
          >
            <div className="flex items-center gap-2 text-gold font-bold text-sm mb-3">
              <Trophy size={16} /> New Personal Records!
            </div>
            {prs.map((name) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-gold/80 text-sm py-1"
              >
                🏆 {name}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="w-full flex flex-col gap-3"
      >
        {(navigator.share as unknown as boolean) && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-plasma to-neon/80 text-bear-void font-bold
              py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> Share Workout
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/home')}
          className="w-full bg-gradient-to-r from-ember to-ember/70 text-white font-bold
            py-4 rounded-xl flex items-center justify-center gap-2"
        >
          Back to Home <ChevronRight size={18} />
        </motion.button>
      </motion.div>
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
    <div className={`glass rounded-2xl p-4 ${accent ? 'border border-gold/30 glow-gold' : ''}`}>
      <Icon size={16} className={accent ? 'text-gold mb-2' : 'text-bear-muted mb-2'} />
      <div className={`font-display text-2xl ${accent ? 'text-gold' : 'text-bear-bright'}`}>{value}</div>
      <div className="text-bear-muted text-xs mt-0.5">{label}</div>
    </div>
  )
}
