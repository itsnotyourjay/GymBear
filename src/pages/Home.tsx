import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Zap, ChevronRight, Dumbbell, TrendingUp, Calendar, Star } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts'
import { useGymBearStore } from '../store/useGymBearStore'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { useBrunoQuote } from '../hooks/useAIPlan'
import { useCoachStore } from '../store/useCoachStore'
import { loadStreak, loadAllSessions } from '../lib/storage'
import { isGymDay, todayDayName, DAY_LABELS, DAY_NAMES, type DayName } from '../lib/dates'
import { getExerciseById, MUSCLE_GROUP_LABELS, type MuscleGroup } from '../data/exercises'
import Bruno from '../components/Bruno'
import BottomNav from '../components/BottomNav'
import CoachCard from '../components/CoachCard'
import ChallengeCard from '../components/ChallengeCard'

// Build last-7-sessions sparkline data
function buildSparkline(sessions: ReturnType<typeof loadAllSessions>) {
  const last7 = sessions.slice(0, 7).reverse()
  return last7.map(({ date, session }) => {
    const vol = (session.weights ?? []).reduce(
      (a: number, wArr: number[], i: number) =>
        a + wArr.reduce((b: number, w: number, j: number) => b + w * ((session.reps?.[i]?.[j]) ?? 0), 0),
      0,
    )
    return { date, vol: Math.round(vol) }
  })
}

export default function Home() {
  const navigate    = useNavigate()
  const userProfile = useGymBearStore((s) => s.userProfile)
  const bruno        = useGymBearStore((s) => s.bruno)
  const { isWorkoutActive, plan }  = useWorkoutStore()
  const quote                       = useBrunoQuote()
  const { insights, runAnalysis }       = useCoachStore()

  const [streak, setStreak]     = useState({ current: 0, best: 0 })
  const [lastSession, setLast]  = useState<null | { date: string; exercises: string[] }>(null)
  const [weeklyVol, setWeeklyVol]   = useState(0)
  const [monthSessions, setMonth]   = useState(0)
  const [sparkData, setSparkData]   = useState<{ date: string; vol: number }[]>([])
  const [planExpanded, setPlanExpanded] = useState(false)

  const gymDay = isGymDay(userProfile?.gymDays ?? [])
  const brunoState = gymDay ? 'pre-workout' : 'rest-day' as const
  const activeInsights = insights.filter((i) => !i.dismissed)

  useEffect(() => {
    const s = loadStreak()
    setStreak(s)
    const sessions = loadAllSessions()
    if (sessions.length > 0) {
      const { date, session } = sessions[0]
      setLast({ date, exercises: session.exercises as string[] })
    }
    // Weekly volume
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    let wVol = 0, mCount = 0
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    for (const { date, session } of sessions) {
      const d = new Date(date)
      if (d >= weekAgo) {
        wVol += (session.weights ?? []).reduce(
          (a: number, wArr: number[], i: number) =>
            a + wArr.reduce((b: number, w: number, j: number) => b + w * ((session.reps?.[i]?.[j]) ?? 0), 0),
          0,
        )
      }
      if (d >= monthAgo) mCount++
    }
    setWeeklyVol(Math.round(wVol))
    setMonth(mCount)
    setSparkData(buildSparkline(sessions))
    // Trigger coaching analysis
    runAnalysis()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Sparkline color logic
  const maxVol = Math.max(...sparkData.map((d) => d.vol), 1)
  const sparkColor = (vol: number) => {
    const pct = vol / maxVol
    if (pct > 0.7) return '#FF3D5A'
    if (pct > 0.35) return '#7B5EFF'
    return '#252560'
  }

  // Greeting text
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  return (
    <div className="min-h-screen mesh-bg flex flex-col pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 safe-top px-5 pt-11 pb-3
        flex items-center justify-between
        bg-bear-void/80 backdrop-blur-xl border-b border-bear-rim/30">
        {/* Streak chip */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-ember/15 border border-ember/30">
          {streak.current > 7 && (
            <span className="absolute inset-0 rounded-full animate-ping bg-ember/20 pointer-events-none" />
          )}
          <Flame size={13} className="text-ember" />
          <span className="text-ember text-xs font-semibold">{streak.current} day streak</span>
        </div>
        {/* Avatar ring */}
        <button
          onClick={() => navigate('/wardrobe')}
          className="w-12 h-12 rounded-full bg-bear-surface border-2 border-plasma/50
            flex items-center justify-center active:scale-90 transition-transform"
        >
          <Bruno state="idle" accessory={bruno.activeAccessory} size={36} />
        </button>
      </div>

      <div className="flex-1 px-5 space-y-4 pt-4">
        {/* ── Hero: Bruno + greeting ── */}
        <div className="relative rounded-3xl overflow-hidden bg-bear-abyss border border-bear-rim/40 py-6">
          {/* Ambient plasma glow behind Bruno */}
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full bg-plasma/20 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="flex flex-col items-center gap-3 relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bruno state={brunoState} accessory={bruno.activeAccessory} level={bruno.level} size={100} />
            </motion.div>
            {/* Greeting */}
            <div className="text-center px-4">
              <h1 className="font-display text-5xl text-bear-bright tracking-wider">{greeting}</h1>
              <p className="text-bear-muted text-sm mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {/* Quote pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mx-4 px-4 py-2.5 glass rounded-full text-center"
            >
              <p className="text-bear-text text-xs italic leading-snug">&ldquo;{quote}&rdquo;</p>
            </motion.div>
          </div>
        </div>

        {/* ── Coach card ── */}
        {activeInsights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CoachCard />
          </motion.div>
        )}

        {/* ── Today's Plan card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {gymDay ? (
            <div className="glass overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-ember to-plasma" />
              <div className="p-5">
                {!plan ? (
                  /* ── No plan yet: guide to PlanBuilder ── */
                  <>
                    <p className="text-[10px] text-ember font-semibold uppercase tracking-widest mb-0.5">Today's Session</p>
                    <h2 className="font-display text-3xl text-bear-bright leading-tight mb-3">Ready to train</h2>
                    <p className="text-bear-muted text-sm mb-4 leading-relaxed">
                      Build your workout plan manually or let AI suggest one based on your history.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate('/plan-builder')}
                      className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Dumbbell size={18} />
                      Plan Today's Workout
                      <ChevronRight size={16} className="ml-auto" />
                    </motion.button>
                  </>
                ) : (
                  /* ── Plan exists: show summary + start ── */
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[10px] text-ember font-semibold uppercase tracking-widest mb-0.5">Today's Session</p>
                        <h2 className="font-display text-3xl text-bear-bright leading-tight">{muscleLabels || 'Freestyle'}</h2>
                      </div>
                      <span className="text-bear-muted text-xs shrink-0 mt-1">~{plan.estimatedMinutes}min</span>
                    </div>

                    {/* Collapsed preview */}
                    {!planExpanded && (
                      <div className="flex flex-wrap gap-1.5 mb-4 mt-2">
                        {plan.exercises.slice(0, 3).map((ex) => {
                          const exercise = getExerciseById(ex.exerciseId)
                          return exercise ? (
                            <span key={ex.exerciseId}
                              className="px-2.5 py-1 rounded-full bg-bear-surface text-bear-text text-[11px] flex items-center gap-1">
                              <Dumbbell size={10} className="text-ember/70" />
                              {exercise.name.split(' ').slice(-1)[0]}
                            </span>
                          ) : null
                        })}
                        {plan.exercises.length > 3 && (
                          <span className="px-2.5 py-1 rounded-full bg-bear-surface text-bear-muted text-[11px]">
                            +{plan.exercises.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expanded view */}
                    <AnimatePresence>
                      {planExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="flex flex-col gap-2 mt-2">
                            {plan.exercises.map((ex) => {
                              const exercise = getExerciseById(ex.exerciseId)
                              return exercise ? (
                                <div key={ex.exerciseId} className="flex items-center gap-2 text-sm text-bear-text">
                                  <Dumbbell size={13} className="text-ember/60 shrink-0" />
                                  <span className="flex-1">{exercise.name}</span>
                                  <span className="text-bear-muted text-xs">{ex.sets.length}×{ex.sets[0].targetReps}</span>
                                </div>
                              ) : null
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate('/workout')}
                        className="flex-1 bg-gradient-to-r from-ember to-ember/80 text-white font-bold
                          py-4 rounded-xl flex items-center justify-center gap-2"
                      >
                        <Zap size={18} />
                        {isWorkoutActive ? 'Resume Workout' : 'Start Workout'}
                        <ChevronRight size={16} className="ml-auto" />
                      </motion.button>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => setPlanExpanded(!planExpanded)}
                          className="flex-1 w-12 rounded-xl bg-bear-surface text-bear-muted flex items-center justify-center"
                        >
                          <motion.div animate={{ rotate: planExpanded ? 90 : 0 }}>
                            <ChevronRight size={18} />
                          </motion.div>
                        </button>
                        <button
                          onClick={() => navigate('/plan-builder')}
                          className="flex-1 w-12 rounded-xl bg-bear-surface text-bear-muted flex items-center justify-center text-[10px] font-semibold"
                          title="Edit plan"
                        >
                          <Dumbbell size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="glass p-5">
              <p className="text-bear-muted text-xs font-semibold uppercase tracking-widest mb-1">Rest Day</p>
              <p className="text-bear-text text-sm">Recovery is part of the program. 🐻</p>
              {nextGymDay && (
                <p className="text-bear-muted/60 text-xs mt-1">Next session: {nextGymDay}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Quick Stats row ── */}
        <div className="overflow-x-auto -mx-5 px-5">
          <div className="flex gap-3 w-max">
            {[
              { label: 'Week Vol', value: weeklyVol > 0 ? `${(weeklyVol / 1000).toFixed(1)}t` : '—', icon: TrendingUp, color: 'text-plasma' },
              { label: 'This Month', value: `${monthSessions} sessions`, icon: Calendar, color: 'text-neon' },
              { label: 'Best Streak', value: `${streak.best} days`, icon: Star, color: 'text-gold' },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="glass shrink-0 w-40 p-4"
              >
                <Icon size={16} className={`${color} mb-2`} />
                <p className="text-bear-muted text-[10px] uppercase tracking-wider">{label}</p>
                <p className={`font-display text-2xl ${color} leading-tight mt-0.5`}>{value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Momentum sparkline ── */}
        {sparkData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass p-4"
          >
            <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">7-Session Momentum</p>
            <ResponsiveContainer width="100%" height={64}>
              <BarChart data={sparkData} barCategoryGap="20%">
                <Bar dataKey="vol" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={400}>
                  {sparkData.map((entry, i) => (
                    <Cell key={i} fill={sparkColor(entry.vol)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Challenge card ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <ChallengeCard />
        </motion.div>

        {/* ── Last session ── */}
        {lastSession && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => navigate('/history')}
            className="w-full glass p-4 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-bear-muted text-[10px] uppercase tracking-wider mb-0.5">Last Session</p>
              <p className="text-bear-text text-sm font-medium">
                {new Date(lastSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-bear-muted text-xs mt-0.5">{lastSession.exercises.length} exercises</p>
            </div>
            <ChevronRight size={18} className="text-bear-muted/50" />
          </motion.button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
