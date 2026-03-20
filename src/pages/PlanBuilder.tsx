/**
 * PlanBuilder.tsx
 * Two modes: "Build Yours" (manual drag-to-reorder) + "AI Suggest" (AI generates, user edits).
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  GripVertical,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Dumbbell,
  Sparkles,
  Pencil,
  Zap,
  Check,
} from 'lucide-react'
import { useWorkoutStore, WorkoutPlan, PlannedExercise } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { EXERCISES } from '../data/exercises'
import { todayISO } from '../lib/dates'
import { haptics } from '../lib/haptics'
import { generateStaticPlan } from '../lib/workoutPlanner'
import { loadAllSessions } from '../lib/storage'
import type { MuscleGroup } from '../data/exercises'

// -- Muscle group accent map --------------------------------------------------
const MG_COLOR: Record<MuscleGroup, string> = {
  chest:     'bg-orange-400/20 text-orange-300 border-orange-400/30',
  shoulders: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  triceps:   'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  biceps:    'bg-blue-400/20 text-blue-300 border-blue-400/30',
  back:      'bg-purple-400/20 text-purple-300 border-purple-400/30',
  legs:      'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
}

// -- Row item type -------------------------------------------------------------
interface RowItem {
  id: string
  exerciseId: string
  sets: number
  reps: number
  rest: number
  expanded: boolean
}

// -- Stepper control -----------------------------------------------------------
function Stepper({ label, value, onDec, onInc, unit = '' }: {
  label: string; value: number; onDec: () => void; onInc: () => void; unit?: string
}) {
  return (
    <div className="flex-1">
      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-center justify-between glass rounded-xl px-3 py-2.5 border border-white/5">
        <button onClick={onDec} className="w-7 h-7 flex items-center justify-center text-white/60 active:text-white text-xl">-</button>
        <span className="font-mono text-white font-semibold text-sm">{value}{unit}</span>
        <button onClick={onInc} className="w-7 h-7 flex items-center justify-center text-white/60 active:text-white text-xl">+</button>
      </div>
    </div>
  )
}

// -- Exercise row (Reorder item) -----------------------------------------------
function ExerciseRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: RowItem
  index: number
  onUpdate: (id: string, patch: Partial<RowItem>) => void
  onRemove: (id: string) => void
}) {
  const exercise = EXERCISES.find((e) => e.id === item.exerciseId)
  if (!exercise) return null
  const colorClass = MG_COLOR[exercise.muscleGroup as MuscleGroup] ?? 'bg-white/10 text-white/60 border-white/10'

  return (
    <Reorder.Item value={item} id={item.id}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.04 }}
        className="glass rounded-2xl mb-3 overflow-hidden border border-white/5 shadow-sm"
      >
        {/* Row header */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Reorder.Item value={item} as="div" className="touch-none cursor-grab active:cursor-grabbing text-white/25 shrink-0">
            <GripVertical size={18} />
          </Reorder.Item>

          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-semibold truncate">{exercise.name}</p>
            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass} capitalize`}>
              {exercise.muscleGroup}
            </span>
          </div>

          <span className="text-white/40 text-xs font-mono shrink-0">{item.sets}×{item.reps}</span>

          <button
            onClick={() => onUpdate(item.id, { expanded: !item.expanded })}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:bg-white/10 transition-colors"
          >
            {item.expanded ? <ChevronUp size={14} className="text-white/60" /> : <ChevronDown size={14} className="text-white/60" />}
          </button>

          <button
            onClick={() => { haptics.light(); onRemove(item.id) }}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:bg-white/10 transition-colors"
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>

        {/* Expanded controls */}
        <AnimatePresence initial={false}>
          {item.expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-4 py-4 flex gap-3">
                <Stepper label="Sets"    value={item.sets} onDec={() => onUpdate(item.id, { sets: Math.max(1, item.sets - 1) })} onInc={() => onUpdate(item.id, { sets: item.sets + 1 })} />
                <Stepper label="Reps"    value={item.reps} onDec={() => onUpdate(item.id, { reps: Math.max(1, item.reps - 1) })} onInc={() => onUpdate(item.id, { reps: item.reps + 1 })} />
                <Stepper label="Rest"    value={item.rest} onDec={() => onUpdate(item.id, { rest: Math.max(30, item.rest - 15) })} onInc={() => onUpdate(item.id, { rest: item.rest + 15 })} unit="s" />
              </div>
              <div className="px-4 pb-4">
                <p className="text-white/30 text-xs leading-relaxed">
                  ?? {exercise.tips}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reorder.Item>
  )
}

// -- Exercise picker sheet -----------------------------------------------------
function ExercisePicker({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | 'all'>('all')
  const customExercises = useGymBearStore((s) => s.customExercises)

  const allExercises = [...EXERCISES, ...customExercises.map((e) => ({ ...e }))]
  const GROUPS: Array<MuscleGroup | 'all'> = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs']

  const filtered = allExercises.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase())
    const matchesGroup = activeGroup === 'all' || e.muscleGroup === activeGroup
    return matchesQuery && matchesGroup
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="relative mt-auto glass rounded-t-[32px] flex flex-col border-t border-white/10"
        style={{ maxHeight: '80dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-5 flex-shrink-0" />

        <div className="flex items-center justify-between px-6 mb-4 flex-shrink-0">
          <h3 className="font-display text-2xl text-white tracking-wide">ADD EXERCISE</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 mb-4 flex-shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors text-sm"
            autoFocus
          />
        </div>

        {/* Muscle group filter */}
        <div className="px-6 mb-4 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all capitalize whitespace-nowrap
                  ${activeGroup === g ? 'bg-white text-black' : 'glass border border-white/10 text-white/60'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-6 pb-8">
          {filtered.length === 0 && (
            <p className="text-white/30 text-center py-8">No exercises found</p>
          )}
          {filtered.map((ex) => {
            const color = MG_COLOR[ex.muscleGroup as MuscleGroup] ?? 'bg-white/10 text-white/60 border-white/10'
            return (
              <motion.button
                key={ex.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onSelect(ex.id); onClose() }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/5 transition-colors text-left mb-1"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color} shrink-0`}>
                  <Dumbbell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-medium truncate">{ex.name}</p>
                  <p className={`text-xs capitalize mt-0.5 font-semibold inline-block`}
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {ex.muscleGroup} · {ex.isCompound ? '90s rest' : '60s rest'}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// -- Main PlanBuilder ----------------------------------------------------------
type Mode = 'build' | 'ai'

export default function PlanBuilder() {
  const navigate    = useNavigate()
  const setPlan     = useWorkoutStore((s) => s.setPlan)
  const userProfile = useGymBearStore((s) => s.userProfile)

  const [mode, setMode]           = useState<Mode>('build')
  const [rows, setRows]           = useState<RowItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)

  // -- Build plan actions -------------------------------------------------------
  const addExercise = useCallback((exerciseId: string) => {
    const exercise = EXERCISES.find((e) => e.id === exerciseId)
    if (!exercise) return
    haptics.light()
    setRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}`,
        exerciseId,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        rest: exercise.isCompound ? 90 : 60,
        expanded: false,
      },
    ])
  }, [])

  const updateRow = useCallback((id: string, patch: Partial<RowItem>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const removeRow = useCallback((id: string) => {
    haptics.light()
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // -- AI plan fetch ---------------------------------------------------------
  const handleAISuggest = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiGenerated(false)

    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
      let plan: WorkoutPlan | null = null

      if (workerUrl && userProfile) {
        const sessions = loadAllSessions().slice(0, 4)
        const sessionCount = loadAllSessions().length
        const gymDaysCount = userProfile.gymDays.length
        const ppl = ['push', 'pull', 'legs']
        const ul  = ['upper', 'legs']
        const split = gymDaysCount >= 3 ? ppl[sessionCount % 3] : ul[sessionCount % 2]
        const muscleGroupMap: Record<string, string[]> = {
          push: ['chest', 'shoulders', 'triceps'],
          pull: ['back', 'biceps'],
          legs: ['legs'],
          upper: ['chest', 'shoulders', 'triceps', 'back', 'biceps'],
        }
        const muscleGroups = muscleGroupMap[split] ?? ['chest', 'shoulders']

        const res = await fetch(`${workerUrl}/api/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: todayISO(),
            goal: userProfile.goal,
            gymDays: userProfile.gymDays,
            duration: userProfile.duration ?? 45,
            split,
            muscleGroups,
            machineIncrements: userProfile.machineIncrements,
            recentSessions: sessions.map(({ date, session }) => ({
              date,
              exercises: (session.exercises as string[]).map((exId: string, i: number) => ({
                id: exId,
                lastWeight: (session.weights as number[][])?.[i]?.[(session.weights as number[][])?.[i]?.length - 1] ?? null,
                lastReps:   (session.reps   as number[][])?.[i]?.[(session.reps    as number[][])?.[i]?.length - 1] ?? null,
              })),
            })),
          }),
        })

        if (res.ok) {
          plan = await res.json() as WorkoutPlan
        }
      }

      // Fallback to static plan
      if (!plan && userProfile) {
        plan = generateStaticPlan(userProfile)
      }

      if (plan) {
        // Convert to row items with staggered animation
        const newRows = plan.exercises.map((ex, i): RowItem => {
          const exercise = EXERCISES.find((e) => e.id === ex.exerciseId)
          return {
            id: `row_ai_${Date.now()}_${i}`,
            exerciseId: ex.exerciseId,
            sets: ex.sets.length,
            reps: ex.sets[0]?.targetReps ?? exercise?.defaultReps ?? 10,
            rest: ex.restSeconds,
            expanded: false,
          }
        }).filter((r) => EXERCISES.find((e) => e.id === r.exerciseId))

        setRows([])
        // Stagger entry for a "typing" feel
        for (let i = 0; i < newRows.length; i++) {
          await new Promise((res) => setTimeout(res, 90))
          setRows((prev) => [...prev, newRows[i]])
        }
        setAiGenerated(true)
      }
    } catch (e) {
      console.error('[PlanBuilder] AI suggest error:', e)
      setAiError('Could not reach AI. Using smart defaults.')
      if (userProfile) {
        const plan = generateStaticPlan(userProfile)
        const newRows = plan.exercises.map((ex, i): RowItem => ({
          id: `row_fallback_${Date.now()}_${i}`,
          exerciseId: ex.exerciseId,
          sets: ex.sets.length,
          reps: ex.sets[0]?.targetReps ?? 10,
          rest: ex.restSeconds,
          expanded: false,
        })).filter((r) => EXERCISES.find((e) => e.id === r.exerciseId))
        setRows(newRows)
        setAiGenerated(true)
      }
    } finally {
      setAiLoading(false)
    }
  }

  // -- Build WorkoutPlan from rows -------------------------------------------
  const buildPlan = (): WorkoutPlan => ({
    date: todayISO(),
    muscleGroups: [...new Set(rows.map((r) => EXERCISES.find((e) => e.id === r.exerciseId)?.muscleGroup ?? 'chest'))] as MuscleGroup[],
    exercises: rows.map((r): PlannedExercise => ({
      exerciseId: r.exerciseId,
      sets: Array.from({ length: r.sets }, () => ({ targetReps: r.reps, targetWeight: null })),
      restSeconds: r.rest,
    })),
    estimatedMinutes: Math.round(rows.reduce((acc, r) => acc + r.sets * (r.rest / 60 + 1), 0)),
    source: aiGenerated ? 'ai' : 'static',
  })

  const handleStart = () => {
    if (rows.length === 0) return
    haptics.success()
    setPlan(buildPlan())
    setSaved(true)
    setTimeout(() => navigate('/workout'), 500)
  }

  // -- Total stats -----------------------------------------------------------
  const totalSets = rows.reduce((a, r) => a + r.sets, 0)
  const estMins   = Math.round(rows.reduce((acc, r) => acc + r.sets * (r.rest / 60 + 1), 0))

  return (
    <div className="min-h-screen mesh-bg flex flex-col pb-36">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-5 pb-4 flex items-center gap-4 bg-[rgba(9,9,18,0.8)] backdrop-blur-2xl border-b border-white/5"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full glass border border-white/10 flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={20} className="text-white/80" />
        </button>

        <div className="flex-1">
          <h1 className="font-display text-2xl text-white tracking-wide leading-none">PLAN BUILDER</h1>
          {rows.length > 0 && (
            <p className="text-white/40 text-xs mt-0.5 font-medium">{rows.length} exercises · {totalSets} sets · ~{estMins} min</p>
          )}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex glass rounded-2xl p-1 border border-white/8">
          {([
            { id: 'build', label: 'Build Yours', icon: Pencil },
            { id: 'ai',    label: 'AI Suggest',  icon: Sparkles },
          ] as const).map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden`}
            >
              {mode === id && (
                <motion.div
                  layoutId="modeHighlight"
                  className="absolute inset-0 bg-white rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={16} className={`relative z-10 ${mode === id ? 'text-black' : 'text-white/60'}`} />
              <span className={`relative z-10 ${mode === id ? 'text-black' : 'text-white/60'}`}>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5">
        <AnimatePresence mode="wait">

          {/* -- BUILD MODE -- */}
          {mode === 'build' && (
            <motion.div key="build" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
              {rows.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-[28px] glass border border-white/10 flex items-center justify-center mb-5 shadow-lg">
                    <Dumbbell size={36} className="text-white/30" />
                  </div>
                  <p className="text-white/60 font-medium text-base mb-1">Empty plan</p>
                  <p className="text-white/30 text-sm">Add exercises below to build your workout</p>
                </motion.div>
              ) : (
                <Reorder.Group axis="y" values={rows} onReorder={setRows} className="pt-2">
                  <AnimatePresence>
                    {rows.map((item, i) => (
                      <ExerciseRow key={item.id} item={item} index={i} onUpdate={updateRow} onRemove={removeRow} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}

              {/* Add exercise button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { haptics.light(); setShowPicker(true) }}
                className="w-full mt-2 py-4 rounded-2xl flex items-center justify-center gap-2.5
                  border-2 border-dashed border-white/15 text-white/50 hover:border-white/30 hover:text-white/80
                  transition-all backdrop-blur-md font-semibold text-sm"
              >
                <Plus size={20} />
                Add Exercise
              </motion.button>
            </motion.div>
          )}

          {/* -- AI SUGGEST MODE -- */}
          {mode === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>

              {/* Not yet generated */}
              {!aiGenerated && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <div className="w-24 h-24 rounded-[32px] glass border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                    <Sparkles size={40} className="text-white/40" />
                  </div>
                  <h2 className="font-display text-3xl text-white mb-2 tracking-wide">AI PLAN</h2>
                  <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
                    Based on your history, goal, and today's split — the AI will suggest a complete workout. You can then edit it freely.
                  </p>
                  {aiError && (
                    <p className="text-amber-400/80 text-xs mb-4 glass border border-amber-400/20 rounded-xl px-4 py-2">{aiError}</p>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAISuggest}
                    className="bg-white text-black font-bold py-4 px-10 rounded-2xl flex items-center gap-3 shadow-lg text-base"
                  >
                    <Sparkles size={20} />
                    Generate My Plan
                  </motion.button>
                </motion.div>
              )}

              {/* Loading state */}
              {aiLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-16 gap-6"
                >
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                        className="w-2.5 h-2.5 rounded-full bg-white"
                      />
                    ))}
                  </div>
                  <p className="text-white/50 text-sm font-medium">Generating your plan…</p>
                </motion.div>
              )}

              {/* Generated — editable rows */}
              {aiGenerated && !aiLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* AI badge */}
                  <div className="flex items-center justify-between mb-4 mt-1">
                    <div className="flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-2">
                      <Sparkles size={14} className="text-white/60" />
                      <span className="text-white/60 text-xs font-semibold">AI Generated · Edit freely</span>
                    </div>
                    <button
                      onClick={() => { setRows([]); setAiGenerated(false) }}
                      className="text-white/40 text-xs font-medium px-3 py-2 hover:text-white/70 transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>

                  <Reorder.Group axis="y" values={rows} onReorder={setRows} className="pt-1">
                    <AnimatePresence>
                      {rows.map((item, i) => (
                        <ExerciseRow key={item.id} item={item} index={i} onUpdate={updateRow} onRemove={removeRow} />
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptics.light(); setShowPicker(true) }}
                    className="w-full mt-2 py-4 rounded-2xl flex items-center justify-center gap-2.5
                      border-2 border-dashed border-white/15 text-white/50
                      hover:border-white/30 hover:text-white/80 transition-all font-semibold text-sm"
                  >
                    <Plus size={20} />
                    Add More
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercise picker sheet */}
      <AnimatePresence>
        {showPicker && <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>

      {/* Bottom CTA */}
      <AnimatePresence>
        {rows.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-0 inset-x-0 px-5 bg-[rgba(9,9,18,0.9)] backdrop-blur-2xl border-t border-white/5"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: '16px' }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              animate={saved ? { scale: [1, 1.03, 1] } : {}}
              onClick={handleStart}
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl
                bg-white text-black"
            >
              {saved ? (
                <><Check size={22} /> Starting…</>
              ) : (
                <><Zap size={22} /> Start Workout · {rows.length} exercises</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
