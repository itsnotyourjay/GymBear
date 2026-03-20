/**
 * PlanBuilder.tsx — Enhancement §10.4
 * Full-page drag-to-reorder workout plan builder using @dnd-kit.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Dumbbell,
  Save,
} from 'lucide-react'
import { useWorkoutStore, WorkoutPlan, PlannedExercise } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { EXERCISES } from '../data/exercises'
import { todayISO } from '../lib/dates'
import { haptics } from '../lib/haptics'

// ── Sortable exercise row ─────────────────────────────────────────────────────
interface RowItem {
  id: string
  exerciseId: string
  sets: number
  reps: number
  rest: number
  expanded: boolean
}

function SortableExerciseRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: RowItem
  onUpdate: (id: string, patch: Partial<RowItem>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const exercise = EXERCISES.find((e) => e.id === item.exerciseId)
  if (!exercise) return null

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`glass rounded-2xl mb-3 overflow-hidden ${isDragging ? 'shadow-lg shadow-plasma/20' : ''}`}>
        {/* Row header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            {...attributes}
            {...listeners}
            className="touch-none text-bear-muted/50 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-bear-bright text-sm font-medium truncate">{exercise.name}</p>
            <p className="text-bear-muted text-xs capitalize">{exercise.muscleGroup}</p>
          </div>

          <span className="text-bear-muted text-xs font-mono">
            {item.sets}×{item.reps}
          </span>

          <button
            onClick={() => onUpdate(item.id, { expanded: !item.expanded })}
            className="w-8 h-8 rounded-lg bg-bear-surface flex items-center justify-center"
          >
            {item.expanded
              ? <ChevronUp size={14} className="text-bear-muted" />
              : <ChevronDown size={14} className="text-bear-muted" />}
          </button>

          <button
            onClick={() => { haptics.light(); onRemove(item.id) }}
            className="w-8 h-8 rounded-lg bg-ember/15 flex items-center justify-center"
          >
            <X size={14} className="text-ember" />
          </button>
        </div>

        {/* Expanded controls */}
        <AnimatePresence initial={false}>
          {item.expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-bear-rim/20"
            >
              <div className="px-4 py-3 flex gap-4">
                {/* Sets */}
                <div className="flex-1">
                  <p className="text-bear-muted text-xs mb-1">Sets</p>
                  <div className="flex items-center gap-2 bg-bear-surface rounded-xl px-3 py-2">
                    <button onClick={() => onUpdate(item.id, { sets: Math.max(1, item.sets - 1) })} className="text-bear-muted">−</button>
                    <span className="flex-1 text-center font-mono text-bear-bright">{item.sets}</span>
                    <button onClick={() => onUpdate(item.id, { sets: item.sets + 1 })} className="text-bear-muted">+</button>
                  </div>
                </div>
                {/* Reps */}
                <div className="flex-1">
                  <p className="text-bear-muted text-xs mb-1">Reps</p>
                  <div className="flex items-center gap-2 bg-bear-surface rounded-xl px-3 py-2">
                    <button onClick={() => onUpdate(item.id, { reps: Math.max(1, item.reps - 1) })} className="text-bear-muted">−</button>
                    <span className="flex-1 text-center font-mono text-bear-bright">{item.reps}</span>
                    <button onClick={() => onUpdate(item.id, { reps: item.reps + 1 })} className="text-bear-muted">+</button>
                  </div>
                </div>
                {/* Rest */}
                <div className="flex-1">
                  <p className="text-bear-muted text-xs mb-1">Rest (s)</p>
                  <div className="flex items-center gap-2 bg-bear-surface rounded-xl px-3 py-2">
                    <button onClick={() => onUpdate(item.id, { rest: Math.max(30, item.rest - 15) })} className="text-bear-muted">−</button>
                    <span className="flex-1 text-center font-mono text-bear-bright text-sm">{item.rest}</span>
                    <button onClick={() => onUpdate(item.id, { rest: item.rest + 15 })} className="text-bear-muted">+</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Exercise picker modal ──────────────────────────────────────────────────────
function ExercisePicker({
  onSelect,
  onClose,
}: {
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const customExercises = useGymBearStore((s) => s.customExercises)
  const allExercises = [...EXERCISES, ...customExercises.map((e) => ({ ...e }))]

  const filtered = allExercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative mt-auto glass rounded-t-3xl flex flex-col"
        style={{ maxHeight: '75dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full bg-bear-rim/60 mx-auto mt-3 mb-4 flex-shrink-0" />
        <div className="flex items-center justify-between px-5 mb-3 flex-shrink-0">
          <h3 className="font-display text-lg text-bear-bright">Add Exercise</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-bear-surface flex items-center justify-center">
            <X size={16} className="text-bear-text" />
          </button>
        </div>
        <div className="px-5 mb-3 flex-shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full px-4 py-3 rounded-2xl bg-bear-surface border border-bear-rim/40 text-bear-bright placeholder-bear-muted/50 focus:outline-none"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex.id); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-bear-surface/60 text-left mb-1"
            >
              <Dumbbell size={16} className="text-bear-muted flex-shrink-0" />
              <div>
                <p className="text-bear-bright text-sm">{ex.name}</p>
                <p className="text-bear-muted text-xs capitalize">{ex.muscleGroup}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main PlanBuilder component ─────────────────────────────────────────────────
export default function PlanBuilder() {
  const navigate = useNavigate()
  const setPlan = useWorkoutStore((s) => s.setPlan)

  const [planName, setPlanName] = useState('')
  const [rows, setRows] = useState<RowItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saved, setSaved] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      haptics.medium()
      setRows((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const addExercise = (exerciseId: string) => {
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
  }

  const updateRow = (id: string, patch: Partial<RowItem>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const buildPlan = (): WorkoutPlan => ({
    date: todayISO(),
    muscleGroups: [...new Set(
      rows.map((r) => EXERCISES.find((e) => e.id === r.exerciseId)?.muscleGroup ?? 'chest')
    )],
    exercises: rows.map((r): PlannedExercise => ({
      exerciseId: r.exerciseId,
      sets: Array.from({ length: r.sets }, () => ({ targetReps: r.reps, targetWeight: null })),
      restSeconds: r.rest,
    })),
    estimatedMinutes: Math.round(rows.reduce((acc, r) => acc + r.sets * (r.rest / 60 + 1), 0)),
    source: 'static',
  })

  const handleUseTodayPlan = () => {
    if (rows.length === 0) return
    haptics.success()
    setPlan(buildPlan())
    setSaved(true)
    setTimeout(() => navigate('/workout'), 600)
  }

  return (
    <div className="min-h-screen mesh-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-bear-rim/20 px-5 pt-safe flex items-center gap-3 h-16">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-bear-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-bear-text" />
        </button>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Plan name…"
          className="flex-1 bg-transparent text-bear-bright font-display text-lg placeholder-bear-muted/50 focus:outline-none"
        />
        {planName.trim() && rows.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl bg-plasma/20 flex items-center justify-center"
            title="Save plan (coming soon)"
          >
            <Save size={16} className="text-plasma" />
          </motion.button>
        )}
      </div>

      <div className="px-5 pt-6">
        {/* Exercise list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence initial={false}>
              {rows.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <SortableExerciseRow
                    item={item}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {/* Empty state */}
        {rows.length === 0 && (
          <div className="text-center py-16">
            <Dumbbell size={48} className="text-bear-muted/30 mx-auto mb-4" />
            <p className="text-bear-muted">Add exercises to build your plan</p>
          </div>
        )}

        {/* Add Exercise button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowPicker(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-bear-rim/40 text-bear-muted flex items-center justify-center gap-2 hover:border-plasma/40 hover:text-plasma transition-colors mb-4"
        >
          <Plus size={18} />
          <span className="text-sm">Add Exercise</span>
        </motion.button>
      </div>

      {/* Bottom CTA */}
      <AnimatePresence>
        {rows.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 p-5 pb-safe glass border-t border-bear-rim/20"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleUseTodayPlan}
              animate={saved ? { scale: [1, 1.04, 1] } : {}}
              className={`w-full py-4 rounded-2xl font-display text-xl text-white transition-all ${
                saved
                  ? 'bg-gradient-to-r from-neon to-plasma'
                  : 'bg-gradient-to-r from-ember to-plasma'
              }`}
            >
              {saved ? 'Heading to Workout! →' : `Use This Plan Today · ${rows.length} exercises`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise picker modal */}
      <AnimatePresence>
        {showPicker && (
          <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
