/**
 * useBodyStore — Enhancement §9.1
 * Body metrics tracker (weight, body fat, measurements, photos).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { lsSet } from '../lib/storage'

export interface BodyMeasurements {
  chest?: number
  waist?: number
  hips?: number
  leftArm?: number
  rightArm?: number
  leftThigh?: number
  rightThigh?: number
}

export interface BodyEntry {
  date: string          // ISO YYYY-MM-DD
  weight?: number       // kg
  bodyFat?: number      // %
  measurements?: BodyMeasurements
  notes?: string
  photoKey?: string     // localStorage key for compressed base64 photo
}

interface BodyStore {
  entries: BodyEntry[]
  addEntry: (entry: BodyEntry) => void
  updateEntry: (date: string, partial: Partial<BodyEntry>) => void
  deleteEntry: (date: string) => void
}

export const useBodyStore = create<BodyStore>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) => {
        set((s) => {
          // Replace same-date entry or prepend
          const filtered = s.entries.filter((e) => e.date !== entry.date)
          const updated  = [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
          lsSet('body:entries', updated)
          return { entries: updated }
        })
      },

      updateEntry: (date, partial) => {
        set((s) => {
          const updated = s.entries.map((e) =>
            e.date === date ? { ...e, ...partial } : e
          )
          lsSet('body:entries', updated)
          return { entries: updated }
        })
      },

      deleteEntry: (date) => {
        set((s) => {
          const updated = s.entries.filter((e) => e.date !== date)
          lsSet('body:entries', updated)
          return { entries: updated }
        })
      },
    }),
    { name: 'gymbear-body' }
  )
)
