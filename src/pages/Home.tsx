import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Zap, ChevronRight, Dumbbell } from 'lucide-react'
import { useGymBearStore } from '../store/useGymBearStore'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { generateStaticPlan } from '../lib/workoutPlanner'
import { loadStreak, loadAllSessions } from '../lib/storage'
import { isGymDay, todayDayName, DAY_LABELS, DAY_NAMES, type DayName } from '../lib/dates'
import { getExerciseById, MUSCLE_GROUP_LABELS, type MuscleGroup } from '../data/exercises'
import BottomNav from '../components/BottomNav'

const BRUNO_QUOTES = [
  "Let's get after it. Your future self is watching.",
  "Progressive overload is the only cheat code.",
  "Show up. That's 80% of the job done.",
  "Rest days are gains days. But not today.",
  "Every rep is a vote for the person you're becoming.",
  "Soreness is weakness leaving the body. You'll be fine.",
]

export default function Home() {
  const navigate    = useNavigate()
  const userProfile = useGymBearStore((s) => s.userProfile)
  const { plan, setPlan, isWorkoutActive } = useWorkoutStore()

  const [streak, setStreak]     = useState({ current: 0, best: 0 })
  const [lastSession, setLast]  = useState<null | { date: string; exercises: string[] }>(null)
  const [quote]                 = useState(() => BRUNO_QUOTES[Math.floor(Math.random() * BRUNO_QUOTES.length)])

  const gymDay = isGymDay(userProfile?.gymDays ?? [])

  useEffect(() => {
    setStreak(loadStreak())
    const sessions = loadAllSessions()
    if (sessions.length > 0) {
      const { date, session } = sessions[0]
      setLast({ date, exercises: session.exercises as string[] })
    }
  }, [])

  // Generate today's plan if not yet done
  useEffect(() => {
    if (!plan && userProfile && gymDay) {
      const today = new Date().toISOString().split('T')[0]
      if (!plan || (plan as { date?: string }).date !== today) {
        setPlan(generateStaticPlan(userProfile))
      }
    }
  }, [plan, userProfile, gymDay, setPlan])

  const nextGymDay = (() => {
    const gymDays = userProfile?.gymDays ?? []
    if (gymDays.length === 0) return null
    const todayIdx = DAY_NAMES.indexOf(todayDayName())
    for (let offset = 1; offset <= 7; offset++) {
      const candidate = DAY_NAMES[(todayIdx + offset) % 7] as DayName
      if (gymDays.includes(candidate)) return DAY_LABELS[candidate]
    }
    return null
  })()

  const muscleLabels = (plan?.muscleGroups ?? [])
    .map((mg) => MUSCLE_GROUP_LABELS[mg as MuscleGroup])
    .join(' · ')

  return (
    <div className="min-h-screen bg-navy flex flex-col pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-off-white tracking-wide">GYMBEAR</h1>
          <p className="text-off-white/50 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/wardrobe')}
          className="w-12 h-12 rounded-2xl bg-blue-dark/50 flex items-center justify-center text-2xl"
        >
          🐻
        </button>
      </div>

      <div className="flex-1 px-5 space-y-4">
        {/* Streak card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-dark/40 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <div className="text-off-white/50 text-xs mb-1 uppercase tracking-wider">Current Streak</div>
            <div className="flex items-end gap-2">
              <span className="font-heading text-5xl text-off-white">{streak.current}</span>
              <span className="text-off-white/60 mb-1 text-sm">days</span>
            </div>
            <div className="text-off-white/40 text-xs mt-0.5">Best: {streak.best} days</div>
          </div>
          <Flame size={44} className={streak.current > 0 ? 'text-orange-gym' : 'text-off-white/20'} />
        </motion.div>

        {/* Bruno quote */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-blue-dark/30 rounded-2xl px-5 py-4 border border-blue-dark/60"
        >
          <div className="text-off-white/40 text-xs mb-1">🐻 Bruno says</div>
          <p className="text-off-white/80 text-sm italic">"{quote}"</p>
        </motion.div>

        {/* Today's workout card */}
        {gymDay ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-elec/20 to-blue-dark/40
              rounded-2xl p-5 border border-red-elec/30"
          >
            <div className="text-red-elec text-xs font-bold uppercase tracking-wider mb-2">
              Today's Session
            </div>
            <div className="font-heading text-2xl text-off-white mb-1">
              {muscleLabels || 'Loading plan…'}
            </div>
            {plan && (
              <div className="text-off-white/50 text-sm mb-4">
                {plan.exercises.length} exercises · ~{plan.estimatedMinutes} min
              </div>
            )}

            {/* Exercise preview */}
            {plan && (
              <div className="flex flex-col gap-1.5 mb-4">
                {plan.exercises.slice(0, 3).map((ex) => {
                  const exercise = getExerciseById(ex.exerciseId)
                  return exercise ? (
                    <div key={ex.exerciseId} className="flex items-center gap-2 text-sm text-off-white/70">
                      <Dumbbell size={13} className="text-red-elec/70 shrink-0" />
                      {exercise.name}
                      <span className="text-off-white/30 text-xs">
                        {ex.sets.length}×{ex.sets[0].targetReps}
                      </span>
                    </div>
                  ) : null
                })}
                {plan.exercises.length > 3 && (
                  <div className="text-off-white/30 text-xs">
                    +{plan.exercises.length - 3} more
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/workout')}
              className="w-full bg-red-elec text-off-white font-bold py-4 rounded-xl
                flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Zap size={18} />
              {isWorkoutActive ? 'Resume Workout' : 'Start Workout'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-dark/40 rounded-2xl p-5"
          >
            <div className="text-off-white/40 text-xs font-bold uppercase tracking-wider mb-2">Rest Day</div>
            <p className="text-off-white/70 text-sm">
              Recovery is part of the program. 🐻
            </p>
            {nextGymDay && (
              <p className="text-off-white/40 text-xs mt-1">
                Next session: {nextGymDay}
              </p>
            )}
          </motion.div>
        )}

        {/* Last session */}
        {lastSession && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/history')}
            className="w-full bg-blue-dark/30 rounded-2xl p-5 text-left
              flex items-center justify-between border border-blue-dark/50"
          >
            <div>
              <div className="text-off-white/40 text-xs uppercase tracking-wider mb-1">Last Session</div>
              <div className="text-off-white font-medium text-sm">
                {new Date(lastSession.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </div>
              <div className="text-off-white/40 text-xs mt-0.5">
                {lastSession.exercises.length} exercises
              </div>
            </div>
            <ChevronRight size={18} className="text-off-white/30" />
          </motion.button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
