/**
 * CustomExerciseSheet.tsx — Enhancement §10.3
 * Bottom sheet for creating custom exercises.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { useGymBearStore, CustomExercise } from '../store/useGymBearStore'
import { MuscleGroup } from '../data/exercises'

interface Props {
  open: boolean
  onClose: () => void
}

type CustomEquipment = CustomExercise['equipment']

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'back', label: 'Back' },
  { value: 'legs', label: 'Legs' },
]

const EQUIPMENT: { value: CustomEquipment; label: string }[] = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'other', label: 'Other / Machine' },
]

export default function CustomExerciseSheet({ open, onClose }: Props) {
  const addCustomExercise = useGymBearStore((s) => s.addCustomExercise)

  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest')
  const [equipment, setEquipment] = useState<CustomEquipment>('dumbbells')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [isCompound, setIsCompound] = useState(false)
  const [tips, setTips] = useState('')

  const canSave = name.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    const ex: CustomExercise = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      equipment,
      tips: tips.trim(),
      defaultSets: sets,
      defaultReps: reps,
      isCompound,
      isCustom: true,
    }
    addCustomExercise(ex)
    // Reset
    setName(''); setTips(''); setSets(3); setReps(10); setIsCompound(false)
    onClose()
  }

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
            className="fixed inset-x-0 bottom-0 z-50 glass rounded-t-3xl px-5 pt-4 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1 rounded-full bg-bear-rim/60 mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-bear-bright">New Exercise</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-bear-surface flex items-center justify-center"
              >
                <X size={18} className="text-bear-text" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cable Fly"
                className="w-full px-4 py-3 rounded-2xl bg-bear-surface border border-bear-rim/40 text-bear-bright placeholder-bear-muted/50 focus:outline-none focus:border-plasma/60"
              />
            </div>

            {/* Muscle group */}
            <div className="mb-4">
              <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Muscle Group</label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((mg) => (
                  <button
                    key={mg.value}
                    onClick={() => setMuscleGroup(mg.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                      muscleGroup === mg.value
                        ? 'bg-plasma text-white'
                        : 'bg-bear-surface text-bear-muted border border-bear-rim/40'
                    }`}
                  >
                    {mg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="mb-4">
              <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map((eq) => (
                  <button
                    key={eq.value}
                    onClick={() => setEquipment(eq.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                      equipment === eq.value
                        ? 'bg-ember text-white'
                        : 'bg-bear-surface text-bear-muted border border-bear-rim/40'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets / Reps */}
            <div className="flex gap-4 mb-4">
              {/* Sets */}
              <div className="flex-1">
                <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Default Sets</label>
                <div className="flex items-center justify-between bg-bear-surface rounded-2xl px-3 py-2 border border-bear-rim/40">
                  <button onClick={() => setSets((v) => Math.max(1, v - 1))} className="text-bear-muted text-lg leading-none px-1">−</button>
                  <span className="font-mono text-bear-bright text-xl">{sets}</span>
                  <button onClick={() => setSets((v) => v + 1)} className="text-bear-muted text-lg leading-none px-1">+</button>
                </div>
              </div>
              {/* Reps */}
              <div className="flex-1">
                <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Default Reps</label>
                <div className="flex items-center justify-between bg-bear-surface rounded-2xl px-3 py-2 border border-bear-rim/40">
                  <button onClick={() => setReps((v) => Math.max(1, v - 1))} className="text-bear-muted text-lg leading-none px-1">−</button>
                  <span className="font-mono text-bear-bright text-xl">{reps}</span>
                  <button onClick={() => setReps((v) => v + 1)} className="text-bear-muted text-lg leading-none px-1">+</button>
                </div>
              </div>
            </div>

            {/* Compound toggle */}
            <button
              onClick={() => setIsCompound((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-4 border transition-colors ${
                isCompound
                  ? 'bg-gold/15 border-gold/40'
                  : 'bg-bear-surface border-bear-rim/40'
              }`}
            >
              <span className="text-bear-text text-sm">Compound movement (90s rest)</span>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isCompound ? 'bg-gold' : 'bg-bear-rim/40'}`}>
                <motion.div
                  animate={{ x: isCompound ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow"
                />
              </div>
            </button>

            {/* Tips */}
            <div className="mb-5">
              <label className="text-bear-muted text-xs uppercase tracking-wider mb-1.5 block">Tips (optional)</label>
              <textarea
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Form cues, notes…"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-bear-surface border border-bear-rim/40 text-bear-bright placeholder-bear-muted/50 focus:outline-none focus:border-plasma/60 resize-none text-sm"
              />
            </div>

            {/* Save */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full py-4 rounded-2xl font-display text-lg flex items-center justify-center gap-2 transition-opacity mb-6 ${
                canSave
                  ? 'bg-gradient-to-r from-plasma to-neon text-white'
                  : 'bg-bear-surface text-bear-muted opacity-50'
              }`}
            >
              <Plus size={18} />
              Add Exercise
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
