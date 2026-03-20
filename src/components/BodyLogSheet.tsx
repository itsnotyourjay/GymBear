/**
 * BodyLogSheet — Enhancement §9.2
 * Bottom sheet to log body weight, body fat %, and notes.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useBodyStore } from '../store/useBodyStore'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BodyLogSheet({ open, onClose }: Props) {
  const { addEntry } = useBodyStore()
  const [weight, setWeight]   = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes]     = useState('')

  const handleSave = () => {
    const entry = {
      date:    new Date().toISOString().split('T')[0],
      weight:  weight  ? parseFloat(weight)  : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      notes:   notes   || undefined,
    }
    addEntry(entry)
    setWeight(''); setBodyFat(''); setNotes('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 glass rounded-t-3xl p-6 safe-bottom"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-bear-bright">Log Body</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-bear-surface flex items-center justify-center">
                <X size={16} className="text-bear-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-bear-muted text-xs uppercase tracking-wider block mb-1.5">
                  Body Weight (kg)
                </label>
                <input
                  type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                  className="w-full bg-bear-surface border border-bear-rim/50 rounded-xl px-4 py-3
                    text-bear-text font-mono text-lg focus:outline-none focus:border-plasma/60"
                />
              </div>

              <div>
                <label className="text-bear-muted text-xs uppercase tracking-wider block mb-1.5">
                  Body Fat % (optional)
                </label>
                <input
                  type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="15.0"
                  className="w-full bg-bear-surface border border-bear-rim/50 rounded-xl px-4 py-3
                    text-bear-text font-mono text-lg focus:outline-none focus:border-plasma/60"
                />
              </div>

              <div>
                <label className="text-bear-muted text-xs uppercase tracking-wider block mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={2} placeholder="How are you feeling?"
                  className="w-full bg-bear-surface border border-bear-rim/50 rounded-xl px-4 py-3
                    text-bear-text text-sm focus:outline-none focus:border-plasma/60 resize-none"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!weight && !bodyFat}
              className="mt-5 w-full bg-gradient-to-r from-plasma to-neon/80 text-bear-void
                font-bold py-4 rounded-xl disabled:opacity-40"
            >
              Save Entry
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
