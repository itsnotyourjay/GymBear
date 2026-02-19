/**
 * GymBear Static Workout Planner
 * Phase 3: deterministic plan generation.
 * Phase 4: this gets replaced by the AI /api/plan endpoint.
 *
 * Push / Pull / Legs rotation based on user gym days.
 * Duration gates how many exercises are included.
 */

import { EXERCISES, type MuscleGroup } from '../data/exercises'
import type { WorkoutPlan, PlannedExercise, PlannedSet } from '../store/useWorkoutStore'
import type { UserProfile } from '../store/useGymBearStore'
import { loadAllSessions } from './storage'
import { todayISO } from './dates'

export type Split = 'push' | 'pull' | 'legs' | 'upper' | 'full'

const PUSH_MUSCLES: MuscleGroup[]  = ['chest', 'shoulders', 'triceps']
const PULL_MUSCLES: MuscleGroup[]  = ['back', 'biceps']
const LEGS_MUSCLES: MuscleGroup[]  = ['legs']
const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'shoulders', 'triceps', 'back', 'biceps']
const FULL_MUSCLES: MuscleGroup[]  = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'legs']

const PPL_ROTATION: Split[] = ['push', 'pull', 'legs']
const UPPER_LOWER: Split[]  = ['upper', 'legs']

// ── Resolve which split to do today ─────────────────────────────────────────
function getMusclesForSplit(split: Split): MuscleGroup[] {
  switch (split) {
    case 'push':  return PUSH_MUSCLES
    case 'pull':  return PULL_MUSCLES
    case 'legs':  return LEGS_MUSCLES
    case 'upper': return UPPER_MUSCLES
    case 'full':  return FULL_MUSCLES
  }
}

function nextSplit(gymDaysPerWeek: number, history: string[]): Split {
  // Derive split from last workout count
  if (gymDaysPerWeek >= 3) {
    const lastSplitIndex = history.length % PPL_ROTATION.length
    return PPL_ROTATION[lastSplitIndex]
  } else {
    const lastSplitIndex = history.length % UPPER_LOWER.length
    return UPPER_LOWER[lastSplitIndex]
  }
}

// ── Rep/set targets by goal ──────────────────────────────────────────────────
function getRepRange(goal: UserProfile['goal']): [number, number] {
  switch (goal) {
    case 'strength':        return [4, 6]
    case 'hypertrophy':     return [8, 12]
    case 'general_fitness': return [10, 15]
    default:                return [10, 12]
  }
}

function getSetsCount(goal: UserProfile['goal']): number {
  switch (goal) {
    case 'strength': return 5
    default:         return 3
  }
}

// ── Exercise count by duration ───────────────────────────────────────────────
function getExerciseCount(duration: 30 | 45 | 60, goal: UserProfile['goal']): number {
  const sets = getSetsCount(goal)
  // Roughly: each exercise = sets × (40s work + rest) ≈ 7 min compound, 5 min isolation
  if (duration === 30) return 3
  if (duration === 45) return Math.min(5, Math.floor(45 / (sets * 2.5)))
  return Math.min(6, Math.floor(60 / (sets * 2.5)))
}

// ── Get last used weight for an exercise from history ────────────────────────
function getLastWeight(exerciseId: string): number | null {
  try {
    const sessions = loadAllSessions()
    for (const { session } of sessions) {
      // SessionData has exercises: string[] + weights: number[][]
      const idx = (session.exercises as string[]).indexOf(exerciseId)
      if (idx !== -1) {
        const weights = (session as any).weights as number[][]
        const lastWeight = weights[idx]?.slice(-1)[0]
        if (lastWeight) return lastWeight
      }
    }
  } catch {
    // no history
  }
  return null
}

// ── Main planner ─────────────────────────────────────────────────────────────
export function generateStaticPlan(profile: UserProfile): WorkoutPlan {
  const gymDaysPerWeek = profile.gymDays.length
  const history        = loadAllSessions().map((s) => s.date)
  const split          = nextSplit(gymDaysPerWeek, history)
  const muscles        = getMusclesForSplit(split)
  const exerciseCount  = getExerciseCount(profile.duration ?? 45, profile.goal)
  const [minReps, maxReps] = getRepRange(profile.goal)
  const setsCount      = getSetsCount(profile.goal)

  // Filter exercises to this split's muscle groups
  const pool = EXERCISES.filter((ex) => muscles.includes(ex.muscleGroup))

  // Prioritise compound movements, then fill with isolation
  const compounds  = pool.filter((ex) => ex.isCompound)
  const isolations = pool.filter((ex) => !ex.isCompound)

  // Pick exercises: at least 1 compound per muscle group, then fill
  const picked = new Set<string>()
  const result = []

  // One compound per muscle group first
  for (const mg of muscles) {
    const comp = compounds.find((ex) => ex.muscleGroup === mg && !picked.has(ex.id))
    if (comp) {
      picked.add(comp.id)
      result.push(comp)
    }
    if (result.length >= exerciseCount) break
  }

  // Fill remaining slots with isolation exercises
  for (const iso of isolations) {
    if (result.length >= exerciseCount) break
    if (!picked.has(iso.id)) {
      picked.add(iso.id)
      result.push(iso)
    }
  }

  // Build plan exercises
  const planExercises: PlannedExercise[] = result.map((ex) => {
    const lastWeight = getLastWeight(ex.id)
    const increment  = ex.muscleGroup === 'legs' ? (profile.machineIncrements.leg ?? 10)
                      : ex.muscleGroup === 'back' ? (profile.machineIncrements.lat ?? 5)
                      : (profile.machineIncrements.chest ?? 5)

    // Progressive overload: last weight + increment, or null for first time
    const targetWeight = lastWeight !== null ? lastWeight + increment : null

    const sets: PlannedSet[] = Array.from({ length: setsCount }, () => ({
      targetReps: Math.round((minReps + maxReps) / 2),
      targetWeight,
    }))

    return {
      exerciseId: ex.id,
      sets,
      restSeconds: ex.isCompound ? 90 : 60,
    }
  })

  const estimatedMinutes = planExercises.reduce(
    (acc, ex) => acc + ex.sets.length * (ex.restSeconds / 60 + 0.75),
    0
  )

  return {
    date: todayISO(),
    muscleGroups: muscles,
    exercises: planExercises,
    estimatedMinutes: Math.round(estimatedMinutes),
    source: 'static',
  }
}
