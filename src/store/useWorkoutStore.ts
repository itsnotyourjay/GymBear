/**
 * GymBear Workout Store
 * Tracks the active workout session and today's plan.
 * Persisted so a session survives a browser refresh.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MuscleGroup } from '../data/exercises'

// ── Plan types (populated by static planner / AI in Phase 4) ─────────────────

export interface PlannedSet {
  targetReps: number
  targetWeight: number | null   // null = user's choice
}

export interface PlannedExercise {
  exerciseId: string
  sets: PlannedSet[]
  restSeconds: number           // compound=90, isolation=60
}

export interface WorkoutPlan {
  date: string
  muscleGroups: MuscleGroup[]
  exercises: PlannedExercise[]
  estimatedMinutes: number
  source: 'ai' | 'static'
}

// ── Session types (tracks what was actually done) ─────────────────────────────

export interface CompletedSet {
  weight: number
  reps: number
  completedAt: string
}

export interface SessionExercise {
  exerciseId: string
  targetSets: number
  restSeconds: number
  completed: CompletedSet[]
}

export interface WorkoutSession {
  date: string
  startTime: string
  exercises: SessionExercise[]
  note: string
}

// ── Store interface ───────────────────────────────────────────────────────────

interface WorkoutStore {
  // Today's plan
  plan: WorkoutPlan | null
  setPlan: (plan: WorkoutPlan) => void
  clearPlan: () => void

  // Active session
  activeSession: WorkoutSession | null
  isWorkoutActive: boolean
  startSession: (plan: WorkoutPlan) => void
  completeSet: (exerciseIndex: number, weight: number, reps: number) => void
  undoLastSet: (exerciseIndex: number) => void
  updateNote: (note: string) => void
  finishSession: () => WorkoutSession | null

  // Rest timer
  restTimerActive: boolean
  restTimerSeconds: number
  restTimerTotal: number
  startRestTimer: (seconds: number) => void
  stopRestTimer: () => void
  tickRestTimer: () => void

  // Current focused exercise index
  currentExerciseIndex: number
  setCurrentExerciseIndex: (i: number) => void
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      // ── Plan ────────────────────────────────────────────────────────────────
      plan: null,
      setPlan: (plan) => set({ plan }),
      clearPlan: () => set({ plan: null }),

      // ── Session ─────────────────────────────────────────────────────────────
      activeSession: null,
      isWorkoutActive: false,

      startSession: (plan) => {
        const session: WorkoutSession = {
          date: plan.date,
          startTime: new Date().toISOString(),
          exercises: plan.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            targetSets: ex.sets.length,
            restSeconds: ex.restSeconds,
            completed: [],
          })),
          note: '',
        }
        set({ activeSession: session, isWorkoutActive: true, currentExerciseIndex: 0 })
      },

      completeSet: (exerciseIndex, weight, reps) => {
        const session = get().activeSession
        if (!session) return
        const exercises = session.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          return {
            ...ex,
            completed: [
              ...ex.completed,
              { weight, reps, completedAt: new Date().toISOString() },
            ],
          }
        })
        set({ activeSession: { ...session, exercises } })
      },

      undoLastSet: (exerciseIndex) => {
        const session = get().activeSession
        if (!session) return
        const exercises = session.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          return { ...ex, completed: ex.completed.slice(0, -1) }
        })
        set({ activeSession: { ...session, exercises } })
      },

      updateNote: (note) => {
        const session = get().activeSession
        if (!session) return
        set({ activeSession: { ...session, note } })
      },

      finishSession: () => {
        const session = get().activeSession
        set({ activeSession: null, isWorkoutActive: false, restTimerActive: false })
        return session
      },

      // ── Rest timer ───────────────────────────────────────────────────────────
      restTimerActive: false,
      restTimerSeconds: 0,
      restTimerTotal: 60,

      startRestTimer: (seconds) =>
        set({ restTimerActive: true, restTimerSeconds: seconds, restTimerTotal: seconds }),

      stopRestTimer: () =>
        set({ restTimerActive: false, restTimerSeconds: 0 }),

      tickRestTimer: () => {
        const { restTimerSeconds } = get()
        if (restTimerSeconds <= 1) {
          set({ restTimerActive: false, restTimerSeconds: 0 })
        } else {
          set({ restTimerSeconds: restTimerSeconds - 1 })
        }
      },

      // ── Navigation ───────────────────────────────────────────────────────────
      currentExerciseIndex: 0,
      setCurrentExerciseIndex: (i) => set({ currentExerciseIndex: i }),
    }),
    { name: 'gymbear-workout' }
  )
)
