import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Check, Minus, Plus, X, FileText } from 'lucide-react'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { getExerciseById, MUSCLE_GROUP_LABELS } from '../data/exercises'
import RestTimer from '../components/RestTimer'
import SessionComplete from './SessionComplete'

export default function Workout() {
  const navigate     = useNavigate()
  const userProfile  = useGymBearStore((s) => s.userProfile)

  const {
    plan, isWorkoutActive, activeSession,
    startSession, completeSet, undoLastSet,
    updateNote, finishSession,
    currentExerciseIndex, setCurrentExerciseIndex,
    startRestTimer, restTimerActive,
  } = useWorkoutStore()

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

  if (!plan) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
        <div className="text-4xl mb-4">🐻</div>
        <p className="text-off-white/60 mb-6">No workout plan for today.</p>
        <button
          onClick={() => navigate('/home')}
          className="bg-red-elec text-off-white font-bold px-8 py-3 rounded-xl"
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (sessionDone && finishedSession) {
    return <SessionComplete session={finishedSession} />
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
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-10 pb-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-blue-dark/40 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-off-white" />
        </button>

        <div className="text-center">
          <div className="font-heading text-xl text-off-white tracking-wide">
            {exercise ? exercise.name.toUpperCase() : 'WORKOUT'}
          </div>
          <div className="text-off-white/40 text-xs">
            {currentExerciseIndex + 1} / {exercises.length}
          </div>
        </div>

        {/* Session clock */}
        <div className="bg-blue-dark/40 px-3 py-1.5 rounded-xl">
          <span className="font-heading text-lg text-off-white">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-4">
        <div className="h-1 bg-blue-dark/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-elec rounded-full transition-all duration-500"
            style={{ width: `${((currentExerciseIndex + (allSetsForThis ? 1 : 0)) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise info */}
      {exercise && (
        <div className="px-5 mb-4">
          <div className="text-off-white/50 text-xs">
            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} ·{' '}
            {exercise.isCompound ? '90s rest' : '60s rest'}
          </div>
          {exercise.tips && (
            <p className="text-off-white/40 text-xs mt-1 italic">{exercise.tips}</p>
          )}
        </div>
      )}

      {/* Rest timer (shown when active) */}
      {restTimerActive && (
        <div className="flex justify-center mb-4">
          <RestTimer />
        </div>
      )}

      {/* Sets table */}
      <div className="px-5 flex-1">
        <div className="flex text-off-white/40 text-xs px-4 mb-2">
          <span className="w-10">SET</span>
          <span className="flex-1 text-center">WEIGHT (kg)</span>
          <span className="flex-1 text-center">REPS</span>
          <span className="w-10 text-center">✓</span>
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: targetSets }).map((_, setIndex) => (
            <SetRow
              key={setIndex}
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
                completeSet(currentExerciseIndex, weight, reps)
                const isLast = setIndex + 1 >= targetSets
                const rest = currentEx?.restSeconds ?? 60
                startRestTimer(rest)
                if (isLast) {
                  // Auto-advance to next exercise after last set
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
          ))}
        </div>
      </div>

      {/* Exercise navigation */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="flex-1 py-3 bg-blue-dark/40 text-off-white/60 rounded-xl
            disabled:opacity-30 font-medium text-sm"
        >
          ← Prev
        </button>

        {currentExerciseIndex < exercises.length - 1 ? (
          <button
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            className="flex-1 py-3 bg-blue-dark/40 text-off-white font-medium text-sm rounded-xl"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all
              ${allExercisesDone
                ? 'bg-red-elec text-off-white'
                : 'bg-blue-dark/40 text-off-white/60'
              }`}
          >
            Finish ✓
          </button>
        )}
      </div>

      {/* Note + exercise list strip */}
      <div className="px-5 pb-8 flex items-center gap-3">
        <button
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-2 text-off-white/40 text-sm hover:text-off-white/70"
        >
          <FileText size={15} />
          Note
        </button>
        <div className="flex-1 overflow-x-auto flex gap-2 pb-1 scrollbar-hide">
          {exercises.map((ex, i) => {
            const exInfo   = getExerciseById(ex.exerciseId)
            const done     = (activeSession?.exercises[i]?.completed.length ?? 0) >= ex.sets.length
            return (
              <button
                key={ex.exerciseId}
                onClick={() => setCurrentExerciseIndex(i)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                  ${i === currentExerciseIndex
                    ? 'bg-red-elec text-off-white'
                    : done
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-blue-dark/40 text-off-white/50'
                  }`}
              >
                {exInfo?.name.split(' ').slice(-1)[0] ?? ex.exerciseId}
              </button>
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
            className="fixed inset-x-0 bottom-0 bg-navy border-t border-blue-dark/60 p-6 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-off-white">Session Note</span>
              <button onClick={() => setShowNote(false)}>
                <X size={20} className="text-off-white/50" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value)
                updateNote(e.target.value)
              }}
              placeholder="How did it go? Any PRs, injuries, energy level…"
              rows={4}
              className="w-full bg-blue-dark/40 text-off-white placeholder-off-white/30
                px-4 py-3 rounded-xl outline-none border border-transparent
                focus:border-red-elec resize-none"
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
      <div className="flex items-center px-4 py-3 rounded-2xl bg-neon-green/10 border border-neon-green/20">
        <span className="w-10 text-neon-green/70 text-sm">{setNumber}</span>
        <span className="flex-1 text-center text-off-white font-bold text-lg">{completedWeight}</span>
        <span className="flex-1 text-center text-off-white font-bold text-lg">{completedReps}</span>
        <button onClick={onUndo} className="w-10 flex justify-center">
          <X size={16} className="text-off-white/30 hover:text-red-elec" />
        </button>
      </div>
    )
  }

  if (!isCurrent) {
    return (
      <div className="flex items-center px-4 py-3 rounded-2xl bg-blue-dark/20 opacity-40">
        <span className="w-10 text-off-white/40 text-sm">{setNumber}</span>
        <span className="flex-1 text-center text-off-white/40">{defaultWeight ?? '—'}</span>
        <span className="flex-1 text-center text-off-white/40">{defaultReps}</span>
        <span className="w-10" />
      </div>
    )
  }

  // Active / current set
  return (
    <motion.div
      initial={{ scale: 0.97 }}
      animate={{ scale: 1 }}
      className="flex items-center px-4 py-3 rounded-2xl bg-blue-dark/50 border border-red-elec/30"
    >
      <span className="w-10 text-red-elec font-bold">{setNumber}</span>

      {/* Weight stepper */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => setWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10))}
          className="w-8 h-8 rounded-lg bg-blue-dark flex items-center justify-center"
        >
          <Minus size={14} className="text-off-white" />
        </button>
        <span className="font-heading text-2xl text-off-white min-w-[52px] text-center">
          {weight}
        </span>
        <button
          onClick={() => setWeight((w) => Math.round((w + 2.5) * 10) / 10)}
          className="w-8 h-8 rounded-lg bg-blue-dark flex items-center justify-center"
        >
          <Plus size={14} className="text-off-white" />
        </button>
      </div>

      {/* Reps stepper */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => setReps((r) => Math.max(1, r - 1))}
          className="w-8 h-8 rounded-lg bg-blue-dark flex items-center justify-center"
        >
          <Minus size={14} className="text-off-white" />
        </button>
        <span className="font-heading text-2xl text-off-white min-w-[32px] text-center">
          {reps}
        </span>
        <button
          onClick={() => setReps((r) => r + 1)}
          className="w-8 h-8 rounded-lg bg-blue-dark flex items-center justify-center"
        >
          <Plus size={14} className="text-off-white" />
        </button>
      </div>

      {/* Complete button */}
      <button
        onClick={() => onComplete(weight, reps)}
        className="w-10 flex justify-center"
      >
        <motion.div
          whileTap={{ scale: 0.8 }}
          className="w-9 h-9 rounded-xl bg-red-elec flex items-center justify-center"
        >
          <Check size={18} className="text-off-white" />
        </motion.div>
      </button>
    </motion.div>
  )
}
