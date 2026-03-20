import { useState, useEffect, useRef } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Check, Minus, Plus, X, FileText } from 'lucide-react'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { getExerciseById, MUSCLE_GROUP_LABELS } from '../data/exercises'
import { haptics } from '../lib/haptics'
import RestTimer from '../components/RestTimer'

export default function Workout() {
  const navigate     = useNavigate()
  const userProfile  = useGymBearStore((s) => s.userProfile)

  const setBrunoAnimation = useGymBearStore((s) => s.setBrunoAnimation)

  const {
    plan, isWorkoutActive, activeSession,
    startSession, completeSet, undoLastSet,
    updateNote, finishSession,
    currentExerciseIndex, setCurrentExerciseIndex,
    startRestTimer, restTimerActive,
  } = useWorkoutStore()

  // Keep screen awake while a workout is active
  useWakeLock(isWorkoutActive)

  const [sessionDone, setSessionDone] = useState(false)
  const [finishedSession, setFinishedSession] = useState<ReturnType<typeof finishSession> extends infer T ? T : never>(null)
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start session if not already active
  useEffect(() => {
    if (plan && !isWorkoutActive) {
      startSession(plan)
    }
  }, [plan, isWorkoutActive, startSession])

  // Session clock
  useEffect(() => {
    if (isWorkoutActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isWorkoutActive])

  // Sync note
  useEffect(() => {
    if (activeSession?.note) setNoteText(activeSession.note)
  }, [activeSession?.note])

  // Bruno: switch to pre-workout when rest timer ends
  useEffect(() => {
    if (!restTimerActive) setBrunoAnimation('pre-workout')
  }, [restTimerActive]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!plan) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-6">🐻</div>
        <p className="text-white/60 mb-8 font-medium">No workout plan for today.</p>
        <button
          onClick={() => navigate('/home')}
          className="bg-white text-black font-semibold px-8 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (sessionDone && finishedSession) {
    navigate('/session-complete')
    return null
  }

  const exercises      = plan.exercises
  const currentEx      = exercises[currentExerciseIndex]
  const exercise       = currentEx ? getExerciseById(currentEx.exerciseId) : null
  const sessionEx      = activeSession?.exercises[currentExerciseIndex]
  const completedSets  = sessionEx?.completed ?? []
  const targetSets     = currentEx?.sets.length ?? 3
  const allSetsForThis = completedSets.length >= targetSets

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleFinish = () => {
    const result = finishSession()
    setFinishedSession(result)
    setSessionDone(true)
  }

  const allExercisesDone = exercises.every((_, i) => {
    const sEx = activeSession?.exercises[i]
    return sEx && sEx.completed.length >= exercises[i].sets.length
  })

  return (
    <div className="min-h-screen mesh-bg flex flex-col pb-safe">
      {/* Top bar */}
      <div 
        className="px-5 pb-4 flex items-center justify-between bg-[rgba(9,9,18,0.7)] backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 saturate-[1.8]"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        <button
          onClick={() => navigate('/home')}
          className="w-11 h-11 rounded-full glass border border-white/10
            flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} className="text-white/80" />
        </button>

        <div className="text-center">
          <div className="font-display text-2xl text-white tracking-wider">
            {exercise ? exercise.name.toUpperCase() : 'WORKOUT'}
          </div>
          <div className="text-white/50 text-xs font-medium tracking-widest mt-0.5">
            {currentExerciseIndex + 1} OF {exercises.length}
          </div>
        </div>

        <div className="glass px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="font-mono text-lg text-white font-medium">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-5 mt-4">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-white rounded-full"
            animate={{ width: `${((currentExerciseIndex + (allSetsForThis ? 1 : 0)) / exercises.length) * 100}%` }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
          />
        </div>
      </div>

      {/* Exercise info / muscle chip */}
      {exercise && (
        <div className="px-6 mb-4 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md bg-white/10 border border-white/10 text-white font-medium text-xs">
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
          </span>
          <span className="text-white/40 text-xs font-medium px-2 border-l border-white/10">
            {exercise.isCompound ? '90s rest' : '60s rest'}
          </span>
        </div>
      )}

      {/* Rest timer (shown when active) */}
      {restTimerActive && (
        <div className="flex justify-center mb-4 px-5">
          <RestTimer />
        </div>
      )}

      {/* Sets table */}
      <div className="px-6 flex-1">
        <div className="flex text-white/40 text-[11px] font-semibold tracking-widest px-4 mb-3 border-b border-white/10 pb-2">
          <span className="w-10">SET</span>
          <span className="flex-1 text-center">WEIGHT (KG)</span>
          <span className="flex-1 text-center">REPS</span>
          <span className="w-10 text-center">✓</span>
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: targetSets }).map((_, setIndex) => (
            <div key={setIndex} className="glass rounded-2xl border border-white/5 shadow-sm overflow-hidden">
              <SetRow
                setNumber={setIndex + 1}
                isCompleted={setIndex < completedSets.length}
                defaultWeight={currentEx?.sets[setIndex]?.targetWeight ?? undefined}
                defaultReps={currentEx?.sets[setIndex]?.targetReps ?? 10}
                lastWeight={completedSets[setIndex - 1]?.weight}
                lastReps={completedSets[setIndex - 1]?.reps}
                completedWeight={completedSets[setIndex]?.weight}
                completedReps={completedSets[setIndex]?.reps}
                isCurrent={setIndex === completedSets.length}
                onComplete={(weight, reps) => {
                  haptics.medium()
                  completeSet(currentExerciseIndex, weight, reps)
                  setBrunoAnimation('set-complete')
                  const isLast = setIndex + 1 >= targetSets
                  const rest = currentEx?.restSeconds ?? 60
                  startRestTimer(rest)
                  setTimeout(() => setBrunoAnimation('rest-timer'), 1200)
                  if (isLast) {
                    setTimeout(() => {
                      if (currentExerciseIndex + 1 < exercises.length) {
                        setCurrentExerciseIndex(currentExerciseIndex + 1)
                      }
                    }, rest * 1000 + 200)
                  }
                }}
                onUndo={() => undoLastSet(currentExerciseIndex)}
                machineIncrements={userProfile?.machineIncrements}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Exercise navigation */}
      <div className="px-6 py-6 flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="flex-1 py-4 bg-white/5 border border-white/10 text-white/80 rounded-2xl
            disabled:opacity-30 font-semibold text-sm active:bg-white/10 transition-colors"
        >
          ← Prev
        </button>

        {currentExerciseIndex < exercises.length - 1 ? (
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            className="flex-1 py-4 bg-white text-black font-bold text-sm rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            Next →
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleFinish}
            className={`flex-1 py-4 rounded-2xl font-bold text-sm shadow-md
              ${allExercisesDone
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/50 border border-white/10'
              }`}
          >
            Finish ✓
          </motion.button>
        )}
      </div>

      {/* Exercise scroll strip */}
      <div className="px-6 safe-bottom mb-10 flex items-center gap-4 pt-2">
        <button
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm font-medium shrink-0"
        >
          <FileText size={18} /> Note
        </button>
        <div className="flex-1 overflow-x-auto flex gap-2.5 pb-1 hide-scrollbar">
          {exercises.map((ex, i) => {
            const exInfo = getExerciseById(ex.exerciseId)
            const done   = (activeSession?.exercises[i]?.completed.length ?? 0) >= ex.sets.length
            return (
              <motion.button
                key={ex.exerciseId}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCurrentExerciseIndex(i)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap
                  ${i === currentExerciseIndex
                    ? 'bg-white text-black shadow-md'
                    : done
                    ? 'glass border-white/30 text-white'
                    : 'bg-white/5 text-white/50 border border-white/5'
                  }`}
              >
                {exInfo?.name.split(' ').slice(-1)[0] ?? ex.exerciseId}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Note input modal */}
      <AnimatePresence>
        {showNote && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 glass rounded-t-[32px] p-6 z-50 border-t border-white/10 shadow-2xl safe-bottom"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="font-bold text-white tracking-wide text-lg">Session Note</span>
              <button onClick={() => setShowNote(false)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">
                <X size={20} className="text-white" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value)
                updateNote(e.target.value)
              }}
              placeholder="How did it go? Any PRs, injuries, or vibes..."
              rows={4}
              className="w-full bg-black/20 text-white placeholder-white/30
                px-5 py-4 rounded-2xl outline-none border border-white/10
                focus:border-white/30 transition-colors resize-none mb-4"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Set Row Component ─────────────────────────────────────────────────────────
interface SetRowProps {
  setNumber: number
  isCompleted: boolean
  isCurrent: boolean
  defaultWeight?: number | null
  defaultReps: number
  lastWeight?: number
  lastReps?: number
  completedWeight?: number
  completedReps?: number
  onComplete: (weight: number, reps: number) => void
  onUndo: () => void
  machineIncrements?: { chest: number; lat: number; leg: number } | null
}

function SetRow({
  setNumber, isCompleted, isCurrent,
  defaultWeight, defaultReps,
  completedWeight, completedReps,
  onComplete, onUndo,
}: SetRowProps) {
  const [weight, setWeight] = useState<number>(defaultWeight ?? 0)
  const [reps, setReps]     = useState<number>(defaultReps)

  if (isCompleted) {
    return (
      <div className="flex items-center px-4 py-3 rounded-2xl glass border-l-2 border-neon/60">
        <span className="w-10 text-neon/70 text-sm">{setNumber}</span>
        <span className="flex-1 text-center text-bear-text font-mono text-lg">{completedWeight}</span>
        <span className="flex-1 text-center text-bear-text font-mono text-lg">{completedReps}</span>
        <button onClick={onUndo} className="w-10 flex justify-center">
          <X size={16} className="text-bear-muted" />
        </button>
      </div>
    )
  }

  if (!isCurrent) {
    return (
      <div className="flex items-center px-4 py-3 rounded-2xl bg-bear-surface/40 opacity-40">
        <span className="w-10 text-bear-muted text-sm">{setNumber}</span>
        <span className="flex-1 text-center text-bear-muted">{defaultWeight ?? '—'}</span>
        <span className="flex-1 text-center text-bear-muted">{defaultReps}</span>
        <span className="w-10" />
      </div>
    )
  }

  // Active / current set
  return (
    <motion.div
      initial={{ scale: 0.97 }}
      animate={{ scale: 1 }}
      className="flex items-center px-4 py-3 rounded-2xl glass border-l-2 border-ember"
    >
      <span className="w-10 text-ember font-bold">{setNumber}</span>

      {/* Weight stepper */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { setWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10)); haptics.light() }}
          className="w-9 h-9 rounded-xl bg-bear-surface border border-bear-rim/50 flex items-center justify-center"
        >
          <Minus size={14} className="text-bear-text" />
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.span
            key={weight}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="font-mono text-2xl text-bear-bright min-w-[52px] text-center"
          >
            {weight}
          </motion.span>
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { setWeight((w) => Math.round((w + 2.5) * 10) / 10); haptics.light() }}
          className="w-9 h-9 rounded-xl bg-bear-surface border border-bear-rim/50 flex items-center justify-center"
        >
          <Plus size={14} className="text-bear-text" />
        </motion.button>
      </div>

      {/* Reps stepper */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { setReps((r) => Math.max(1, r - 1)); haptics.light() }}
          className="w-9 h-9 rounded-xl bg-bear-surface border border-bear-rim/50 flex items-center justify-center"
        >
          <Minus size={14} className="text-bear-text" />
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.span
            key={reps}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="font-mono text-2xl text-bear-bright min-w-[32px] text-center"
          >
            {reps}
          </motion.span>
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { setReps((r) => r + 1); haptics.light() }}
          className="w-9 h-9 rounded-xl bg-bear-surface border border-bear-rim/50 flex items-center justify-center"
        >
          <Plus size={14} className="text-bear-text" />
        </motion.button>
      </div>

      {/* Complete button */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => onComplete(weight, reps)}
        className="w-10 flex justify-center"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember to-plasma flex items-center justify-center">
          <Check size={18} className="text-white" />
        </div>
      </motion.button>
    </motion.div>
  )
}
