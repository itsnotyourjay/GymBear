/**
 * Progress Hub — revamped
 * Tabs: Strength | Body | Habits
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { Trophy, Plus } from 'lucide-react'
import { loadAllSessions, loadPR } from '../lib/storage'
import { EXERCISES, MUSCLE_GROUP_LABELS, type MuscleGroup } from '../data/exercises'
import { formatDate } from '../lib/dates'
import { useBodyStore } from '../store/useBodyStore'
import { useGymBearStore } from '../store/useGymBearStore'
import BodyLogSheet from '../components/BodyLogSheet'
import BottomNav from '../components/BottomNav'

type MainTab = 'strength' | 'body' | 'habits'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'body',     label: 'Body' },
  { id: 'habits',   label: 'Habits' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildWeightData(exerciseId: string) {
  const sessions = loadAllSessions()
  const points: { date: string; weight: number }[] = []
  for (const { date, session } of sessions) {
    const idx = session.exercises.indexOf(exerciseId)
    if (idx === -1) continue
    const weights = session.weights?.[idx] ?? []
    if (weights.length === 0) continue
    const best = Math.max(...weights)
    points.push({ date: formatDate(date), weight: best })
  }
  return points.reverse()
}

function buildHeatmap84(): { date: string; count: number }[] {
  const sessions = loadAllSessions()
  const sessionDates = new Set(sessions.map((s) => s.date))
  const cells: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    cells.push({ date: iso, count: sessionDates.has(iso) ? 1 : 0 })
  }
  return cells
}

const HEATMAP_COLOR = (count: number) =>
  count === 0 ? '#252560' : '#7B5EFF'

// ── Strength Tab ──────────────────────────────────────────────────────────────

function StrengthTab() {
  const [selectedId, setSelectedId] = useState(EXERCISES[0].id)
  const data = useMemo(() => buildWeightData(selectedId), [selectedId])
  const prs = EXERCISES.map((ex) => {
    const pr = loadPR(ex.id)
    return pr ? { name: ex.name, muscleGroup: ex.muscleGroup, ...pr } : null
  }).filter(Boolean) as Array<{ name: string; muscleGroup: string; bestWeight: number; bestReps: number; date: string }>

  return (
    <div className="space-y-4">
      {/* Weight progress chart */}
      <div className="glass p-4">
        <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">Weight Progress</p>
        <div className="mb-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-bear-surface border border-bear-rim/50 rounded-xl px-4 py-2.5
              text-bear-text text-sm focus:outline-none focus:border-plasma/60"
          >
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-bear-abyss">{ex.name}</option>
            ))}
          </select>
        </div>
        {data.length < 2 ? (
          <div className="flex items-center justify-center h-32 text-bear-muted text-sm text-center">
            Log at least 2 sessions with this exercise.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="plasmaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B5EFF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7B5EFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#3A3A7A', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#3A3A7A', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#12122A', border: '1px solid #252560', borderRadius: 10, color: '#C8C8F0', fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, 'Weight']}
              />
              <Area type="monotone" dataKey="weight" fill="url(#plasmaGrad)" stroke="none" animationDuration={600} />
              <Line type="monotone" dataKey="weight" stroke="#7B5EFF" strokeWidth={2.5}
                dot={{ fill: '#7B5EFF', r: 3 }} activeDot={{ r: 5 }} animationDuration={600} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Activity heatmap */}
      <HeatmapCard />

      {/* PR records */}
      <div className="glass p-4">
        <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">Personal Records</p>
        {prs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-bear-muted text-sm">
            Complete sessions to set PRs.
          </div>
        ) : (
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={pr.name} className="flex items-center justify-between py-2 border-b border-bear-rim/30 last:border-0">
                <div>
                  <p className="text-bear-text text-sm">{pr.name}</p>
                  <p className="text-bear-muted text-[10px]">{MUSCLE_GROUP_LABELS[pr.muscleGroup as MuscleGroup]} · {formatDate(pr.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-display text-xl">{pr.bestWeight} kg</p>
                  <p className="text-bear-muted text-xs">{pr.bestReps} reps</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HeatmapCard() {
  const cells = useMemo(() => buildHeatmap84(), [])
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  const total = cells.filter((c) => c.count > 0).length

  return (
    <div className="glass p-4">
      <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">
        12 Weeks · {total} sessions
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1.5 mr-1 pt-0.5">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-bear-muted/50 text-[8px] h-3 flex items-center">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5 shrink-0">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: HEATMAP_COLOR(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Body Tab ──────────────────────────────────────────────────────────────────

function BodyTab() {
  const { entries } = useBodyStore()
  const [showLog, setShowLog] = useState(false)

  const weightData = entries
    .filter((e) => e.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: formatDate(e.date), weight: e.weight! }))

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowLog(true)}
        className="w-full glass py-3 rounded-2xl flex items-center justify-center gap-2
          text-plasma font-semibold text-sm border border-plasma/30"
      >
        <Plus size={16} /> Log Body Metrics
      </button>

      {weightData.length >= 2 ? (
        <div className="glass p-4">
          <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">Body Weight (kg)</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={weightData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B5EFF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7B5EFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#3A3A7A', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#3A3A7A', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#12122A', border: '1px solid #252560', borderRadius: 10, color: '#C8C8F0', fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, 'Weight']}
              />
              <Area type="monotone" dataKey="weight" fill="url(#bodyGrad)" stroke="none" />
              <Line type="monotone" dataKey="weight" stroke="#7B5EFF" strokeWidth={2.5} dot={{ fill: '#7B5EFF', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="glass p-8 flex flex-col items-center text-center">
          <span className="text-4xl mb-2">⚖️</span>
          <p className="text-bear-muted text-sm">Log 2+ body weight entries to see your trend.</p>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="glass p-4 space-y-3">
          <p className="text-bear-muted text-[10px] uppercase tracking-widest">Recent Entries</p>
          {entries.slice(0, 5).map((e) => (
            <div key={e.date} className="flex items-center justify-between py-1.5 border-b border-bear-rim/30 last:border-0">
              <p className="text-bear-muted text-xs">{formatDate(e.date)}</p>
              <div className="flex gap-3 text-right">
                {e.weight != null && <p className="text-bear-text text-sm">{e.weight} kg</p>}
                {e.bodyFat != null && <p className="text-neon text-sm">{e.bodyFat}% BF</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <BodyLogSheet open={showLog} onClose={() => setShowLog(false)} />
    </div>
  )
}

// ── Habits Tab ────────────────────────────────────────────────────────────────

function HabitsTab() {
  const userProfile = useGymBearStore((s) => s.userProfile)
  const sessions = useMemo(() => loadAllSessions(), [])

  // Month calendar
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const sessionDates = new Set(sessions.map((s) => s.date))

  // Radar data
  const thisWeekSessions = sessions.filter(({ date }) => {
    const d = new Date(date)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }).length
  const gymDayTarget = userProfile?.gymDays?.length ?? 3
  const thisWeekVol = sessions.slice(0, 7).reduce((a, { session }) =>
    a + (session.weights ?? []).reduce(
      (s: number, wArr: number[], i: number) =>
        s + wArr.reduce((b: number, w: number, j: number) => b + w * ((session.reps?.[i]?.[j]) ?? 0), 0),
      0,
    ), 0)
  const maxExpectedVol = 10000
  const streak = sessions.length > 0 ? Math.min(sessions.filter((_, i) => i < 7).length, 7) : 0
  const radarData = [
    { subject: 'Frequency', goal: 100, actual: Math.min(100, (thisWeekSessions / Math.max(gymDayTarget, 1)) * 100) },
    { subject: 'Volume',    goal: 100, actual: Math.min(100, (thisWeekVol / maxExpectedVol) * 100) },
    { subject: 'Streak',    goal: 100, actual: Math.min(100, (streak / 7) * 100) },
    { subject: 'Sessions',  goal: 100, actual: Math.min(100, (sessions.slice(0, 30).length / 12) * 100) },
    { subject: 'Consistency', goal: 100, actual: Math.min(100, (sessions.length / 20) * 100) },
  ]

  return (
    <div className="space-y-4">
      {/* Month calendar */}
      <div className="glass p-4">
        <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-3">
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {['S','M','T','W','T','F','S'].map((d) => (
            <div key={d} className="text-center text-[9px] text-bear-muted/50 pb-1">{d}</div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const worked = sessionDates.has(iso)
            const isToday = day === today.getDate()
            return (
              <div key={day} className={`
                aspect-square rounded-full flex items-center justify-center text-xs
                ${worked ? 'bg-ember text-white' : isToday ? 'border border-plasma/60 text-plasma' : 'text-bear-muted/50'}
                ${isToday && !worked ? 'animate-pulse' : ''}
              `}>
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Radar chart */}
      <div className="glass p-4">
        <p className="text-bear-muted text-[10px] uppercase tracking-widest mb-1">Goal vs Actual</p>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <PolarGrid stroke="#252560" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#3A3A7A', fontSize: 10 }} />
            <Radar name="Goal" dataKey="goal" stroke="#FF3D5A" fill="#FF3D5A" fillOpacity={0.2} />
            <Radar name="Actual" dataKey="actual" stroke="#7B5EFF" fill="#7B5EFF" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Progress() {
  const bruno = useGymBearStore((s) => s.bruno)
  const [tab, setTab] = useState<MainTab>('strength')

  return (
    <div className="min-h-screen mesh-bg flex flex-col pb-28">
      {/* Header */}
      <div className="safe-top px-5 pt-11 pb-4 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="font-display text-4xl text-bear-bright tracking-wide">PROGRESS</h1>
          <p className="text-bear-muted text-xs">Level {bruno.level} · {bruno.xp.toLocaleString()} XP</p>
        </div>
        <Trophy size={22} className="text-gold" />
      </div>

      {/* Tab bar with sliding indicator */}
      <div className="flex mx-5 gap-0 bg-bear-surface rounded-2xl p-1 mb-5 relative">
        {MAIN_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 relative py-2.5 text-xs font-semibold rounded-xl transition-colors
              ${tab === id ? 'text-bear-bright' : 'text-bear-muted'}`}
          >
            {tab === id && (
              <motion.div
                layoutId="progressTab"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-plasma/30 to-plasma/10 border border-plasma/30"
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'strength' && <StrengthTab />}
            {tab === 'body'     && <BodyTab />}
            {tab === 'habits'   && <HabitsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}



