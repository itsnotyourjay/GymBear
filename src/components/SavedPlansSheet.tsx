/**
 * SavedPlansSheet.tsx — Enhancement §10.5
 * Bottom sheet listing saved custom plans + AI plan.
 * Tap to load as today's workout; swipe-left to delete custom plans.
 */

import { useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Dumbbell, Sparkles, Trash2, ChevronRight } from 'lucide-react'
import { useWorkoutStore, WorkoutPlan } from '../store/useWorkoutStore'
import { todayISO } from '../lib/dates'

interface SavedPlan {
  id: string
  name: string
  plan: WorkoutPlan
  isCustom: boolean
}

interface Props {
  open: boolean
  aiPlan: WorkoutPlan | null
  savedPlans: SavedPlan[]
  onRemovePlan: (id: string) => void
  onClose: () => void
}

function PlanRow({
  saved,
  onSelect,
  onDelete,
}: {
  saved: SavedPlan
  onSelect: () => void
  onDelete: () => void
}) {
  const [dragX, setDragX] = useState(0)
  const [deleted, setDeleted] = useState(false)

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80 && saved.isCustom) {
      setDeleted(true)
      setTimeout(onDelete, 300)
    } else {
      setDragX(0)
    }
  }

  if (deleted) return null

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3">
      {/* Delete reveal */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-ember rounded-2xl w-24">
        <Trash2 size={18} className="text-white" />
      </div>
      <motion.div
        drag={saved.isCustom ? 'x' : false}
        dragConstraints={{ left: -100, right: 0 }}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={onDragEnd}
        animate={{ x: dragX < -80 ? -100 : 0 }}
        className="relative glass"
      >
        <button
          onClick={onSelect}
          className="w-full flex items-center gap-3 px-4 py-4 text-left"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${saved.isCustom ? 'bg-ember/20' : 'bg-plasma/20'}`}>
            {saved.isCustom
              ? <Dumbbell size={18} className="text-ember" />
              : <Sparkles size={18} className="text-plasma" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-bear-bright font-medium truncate">{saved.name}</p>
            <p className="text-bear-muted text-xs">
              {saved.plan.exercises.length} exercises · ~{saved.plan.estimatedMinutes} min
            </p>
          </div>
          <ChevronRight size={16} className="text-bear-muted flex-shrink-0" />
        </button>
      </motion.div>
    </div>
  )
}

export default function SavedPlansSheet({
  open,
  aiPlan,
  savedPlans,
  onRemovePlan,
  onClose,
}: Props) {
  const setPlan = useWorkoutStore((s) => s.setPlan)

  const handleSelect = (plan: WorkoutPlan) => {
    // Set plan as today's with today's date
    setPlan({ ...plan, date: todayISO() })
    onClose()
  }

  const allOptions: SavedPlan[] = [
    ...(aiPlan ? [{
      id: 'ai_plan',
      name: "Today's AI Plan",
      plan: aiPlan,
      isCustom: false,
    }] : []),
    ...savedPlans,
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 glass rounded-t-3xl px-5 pt-4 pb-safe max-h-[75dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-bear-rim/60 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-bear-bright">Saved Plans</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-bear-surface flex items-center justify-center"
              >
                <X size={18} className="text-bear-text" />
              </button>
            </div>

            {allOptions.length === 0 ? (
              <div className="text-center py-10">
                <Dumbbell size={36} className="text-bear-muted mx-auto mb-3" />
                <p className="text-bear-muted">No saved plans yet.</p>
                <p className="text-bear-muted/60 text-sm mt-1">Build one in the Plan Builder.</p>
              </div>
            ) : (
              <div className="mb-6">
                {allOptions.map((s) => (
                  <PlanRow
                    key={s.id}
                    saved={s}
                    onSelect={() => handleSelect(s.plan)}
                    onDelete={() => onRemovePlan(s.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
