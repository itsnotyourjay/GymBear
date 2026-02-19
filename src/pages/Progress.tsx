/**
 * Progress Hub
 * PRD Section 5.6, Phase 5
 * Tabs: Weight | Volume | Frequency | Records
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { ChevronLeft, TrendingUp, BarChart2, Calendar, Trophy } from 'lucide-react'
import { loadAllSessions, loadPR } from '../lib/storage'
import { EXERCISES, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from '../data/exercises'
import { formatDate } from '../lib/dates'
import { useGymBearStore } from '../store/useGymBearStore'
import BottomNav from '../components/BottomNav'

type Tab = 'weight' | 'volume' | 'frequency' | 'records'

const TABS: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: 'weight',    label: 'Weight',  icon: TrendingUp },
  { id: 'volume',    label: 'Volume',  icon: BarChart2 },
  { id: 'frequency', label: 'Activity', icon: Calendar },
  { id: 'records',   label: 'PRs',     icon: Trophy },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function buildVolumeData() {
  const sessions = loadAllSessions().slice(0, 7) // last 7 sessions
  const result: Record<string, number> = {}
  for (const mg of MUSCLE_GROUPS) result[mg] = 0
  for (const { session } of sessions) {
    session.exercises.forEach((exId, i) => {
      const ex = EXERCISES.find((e) => e.id === exId)
      if (!ex) return
      const weights = session.weights?.[i] ?? []
      const reps    = session.reps?.[i]    ?? []
      const vol = weights.reduce((a, w, j) => a + w * (reps[j] ?? 0), 0)
      result[ex.muscleGroup] = (result[ex.muscleGroup] ?? 0) + vol
    })
  }
  return MUSCLE_GROUPS.map((mg) => ({
    name: MUSCLE_GROUP_LABELS[mg as MuscleGroup].slice(0, 4),
    volume: Math.round(result[mg] ?? 0),
  })).filter((d) => d.volume > 0)
}

function buildHeatmap(): { date: string; count: number }[] {
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

// ── Sub-views ─────────────────────────────────────────────────────────────────

function WeightTab() {
  const [selectedId, setSelectedId] = useState(EXERCISES[0].id)
  const data = useMemo(() => buildWeightData(selectedId), [selectedId])

  return (
    <div>
      {/* Exercise picker */}
      <div className="mb-4">
        <label className="text-off-white/40 text-xs font-bold uppercase tracking-wider block mb-2">
          Exercise
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-blue-dark/40 border border-blue-dark/60 rounded-xl px-4 py-3
            text-off-white text-sm focus:outline-none focus:border-red-elec"
        >
          {EXERCISES.map((ex) => (
            <option key={ex.id} value={ex.id} className="bg-navy">
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {data.length < 2 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <p className="text-off-white/40 text-sm">Log at least 2 sessions with this exercise to see progression.</p>
        </div>
      ) : (
        <div className="bg-blue-dark/30 rounded-2xl p-4">
          <p className="text-off-white/50 text-xs mb-3 uppercase tracking-wider">Best Weight Per Session (kg)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0F3460" />
              <XAxis dataKey="date" tick={{ fill: '#F5F5F580', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#F5F5F580', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F3460', border: 'none', borderRadius: 8, color: '#F5F5F5', fontSize: 12 }}
                formatter={(v: number) => [`${v} kg`, 'Weight']}
              />
              <Line
                type="monotone" dataKey="weight" stroke="#E94560"
                strokeWidth={2.5} dot={{ fill: '#E94560', r: 4 }} activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function VolumeTab() {
  const data = useMemo(() => buildVolumeData(), [])

  return (
    <div className="bg-blue-dark/30 rounded-2xl p-4">
      <p className="text-off-white/50 text-xs mb-3 uppercase tracking-wider">Volume by Muscle Group (last 7 sessions)</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-off-white/40 text-sm text-center">Complete some sessions to see volume data.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0F3460" />
            <XAxis dataKey="name" tick={{ fill: '#F5F5F580', fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: '#F5F5F580', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0F3460', border: 'none', borderRadius: 8, color: '#F5F5F5', fontSize: 12 }}
              formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']}
            />
            <Bar dataKey="volume" fill="#E94560" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function FrequencyTab() {
  const cells = useMemo(() => buildHeatmap(), [])
  // Group into weeks (12 rows of 7)
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  const totalSessions = cells.filter((c) => c.count > 0).length

  return (
    <div>
      <div className="bg-blue-dark/30 rounded-2xl p-4 mb-4">
        <p className="text-off-white/50 text-xs mb-3 uppercase tracking-wider">
          Last 12 Weeks · {totalSessions} sessions
        </p>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="w-3 h-3 flex items-center justify-center text-off-white/30 text-[8px]">
                {d}
              </div>
            ))}
          </div>
          {/* Grid — each inner array is a 7-day column (week) */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={cell.date}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    cell.count > 0 ? 'bg-red-elec' : 'bg-blue-dark/60'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <div className="w-3 h-3 rounded-sm bg-blue-dark/60" />
          <span className="text-off-white/30 text-xs">Rest</span>
          <div className="w-3 h-3 rounded-sm bg-red-elec ml-2" />
          <span className="text-off-white/30 text-xs">Training</span>
        </div>
      </div>
    </div>
  )
}

function RecordsTab() {
  const prs = EXERCISES.map((ex) => {
    const pr = loadPR(ex.id)
    return pr ? { name: ex.name, muscleGroup: ex.muscleGroup, ...pr } : null
  }).filter(Boolean) as Array<{ name: string; muscleGroup: string; bestWeight: number; bestReps: number; date: string }>

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-off-white/50 text-sm">Complete sessions to set personal records.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {prs.map((pr) => (
        <div key={pr.name} className="bg-blue-dark/30 rounded-2xl px-4 py-3 flex items-center justify-between border border-blue-dark/50">
          <div>
            <div className="text-off-white/80 text-sm font-medium">{pr.name}</div>
            <div className="text-off-white/40 text-xs mt-0.5">
              {MUSCLE_GROUP_LABELS[pr.muscleGroup as MuscleGroup]} · {formatDate(pr.date)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gold font-heading text-lg">{pr.bestWeight} kg</div>
            <div className="text-off-white/40 text-xs">{pr.bestReps} reps</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Progress() {
  const navigate    = useNavigate()
  const bruno       = useGymBearStore((s) => s.bruno)
  const [tab, setTab] = useState<Tab>('weight')

  return (
    <div className="min-h-screen bg-navy flex flex-col pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-blue-dark/40 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-off-white" />
        </button>
        <div>
          <h1 className="font-heading text-3xl text-off-white tracking-wide">PROGRESS</h1>
          <p className="text-off-white/40 text-xs">Level {bruno.level} · {bruno.xp.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex mx-4 bg-blue-dark/40 rounded-2xl p-1 mb-5 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              tab === id
                ? 'bg-red-elec text-off-white'
                : 'text-off-white/50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4">
        {tab === 'weight'    && <WeightTab />}
        {tab === 'volume'    && <VolumeTab />}
        {tab === 'frequency' && <FrequencyTab />}
        {tab === 'records'   && <RecordsTab />}
      </div>

      <BottomNav />
    </div>
  )
}
