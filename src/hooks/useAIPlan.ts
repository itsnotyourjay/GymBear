/**
 * useAIPlan — React hook
 * PRD Section 8 — AI plan fetching with static fallback
 *
 * Strategy:
 *  1. If today's plan is already in the Zustand store → return it immediately
 *  2. Call worker /api/plan with user profile + last 4 sessions
 *  3. If worker fails (no URL, offline, error) → fall back to generateStaticPlan
 *  4. Cache the plan in the store
 */

import { useState, useEffect, useCallback } from 'react'
import { useWorkoutStore } from '../store/useWorkoutStore'
import { useGymBearStore } from '../store/useGymBearStore'
import { generateStaticPlan } from '../lib/workoutPlanner'
import { loadAllSessions, lsGet } from '../lib/storage'
import { todayISO } from '../lib/dates'
import type { WorkoutPlan } from '../store/useWorkoutStore'

// Determine which split to run today (mirrors workoutPlanner logic)
function determineSplit(gymDaysPerWeek: number, sessionCount: number): string {
  const ppl = ['push', 'pull', 'legs']
  const ul  = ['upper', 'legs']
  if (gymDaysPerWeek >= 3) return ppl[sessionCount % 3]
  return ul[sessionCount % 2]
}

function determineMuscleGroups(split: string): string[] {
  switch (split) {
    case 'push':  return ['chest', 'shoulders', 'triceps']
    case 'pull':  return ['back', 'biceps']
    case 'legs':  return ['legs']
    case 'upper': return ['chest', 'shoulders', 'triceps', 'back', 'biceps']
    default:      return ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'legs']
  }
}

export interface UseAIPlanResult {
  plan:    WorkoutPlan | null
  loading: boolean
  error:   string | null
  source:  'ai' | 'static' | 'cached' | null
  refresh: () => void
}

export function useAIPlan(): UseAIPlanResult {
  const userProfile  = useGymBearStore((s) => s.userProfile)
  const { plan, setPlan } = useWorkoutStore()

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [source,  setSource]  = useState<'ai' | 'static' | 'cached' | null>(null)

  const today = todayISO()

  const fetchPlan = useCallback(async (force = false) => {
    if (!userProfile?.onboardingComplete) return

    // Return existing plan if it's for today and not forced
    if (plan && plan.date === today && !force) {
      setSource('cached')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
      const sessions  = loadAllSessions().slice(0, 4)
      const sessionCount = loadAllSessions().length

      const split         = determineSplit(userProfile.gymDays.length, sessionCount)
      const muscleGroups  = determineMuscleGroups(split)

      // Build recent session history for the AI prompt
      const recentSessions = sessions.map(({ date, session }) => ({
        date,
        exercises: session.exercises.map((exId, i) => ({
          id:         exId,
          lastWeight: session.weights?.[i]?.[session.weights[i].length - 1] ?? null,
          lastReps:   session.reps?.[i]?.[session.reps[i].length - 1]       ?? null,
        })),
      }))

      // Try worker if URL is configured
      if (workerUrl) {
        const res = await fetch(`${workerUrl}/api/plan`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date:              today,
            goal:              userProfile.goal,
            gymDays:           userProfile.gymDays,
            duration:          userProfile.duration ?? 45,
            split,
            muscleGroups,
            machineIncrements: userProfile.machineIncrements,
            recentSessions,
          }),
        })

        if (res.ok) {
          const aiPlan = await res.json() as WorkoutPlan
          setPlan({ ...aiPlan, source: aiPlan.source ?? 'ai' })
          setSource(aiPlan.source ?? 'ai')
          setLoading(false)
          return
        }

        const errBody = await res.json().catch(() => ({})) as { error?: string }
        console.warn('[GymBear] Worker /api/plan failed:', errBody.error)
      }

      // Static fallback
      const staticPlan = generateStaticPlan(userProfile)
      setPlan(staticPlan)
      setSource('static')
    } catch (e) {
      console.warn('[GymBear] useAIPlan error, using static:', e)
      if (userProfile) {
        const staticPlan = generateStaticPlan(userProfile)
        setPlan(staticPlan)
        setSource('static')
      } else {
        setError('Could not generate plan')
      }
    } finally {
      setLoading(false)
    }
  }, [userProfile, plan, today, setPlan])

  useEffect(() => {
    fetchPlan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.onboardingComplete])

  return {
    plan,
    loading,
    error,
    source,
    refresh: () => fetchPlan(true),
  }
}

// ── Bruno quote hook ──────────────────────────────────────────────────────────
const FALLBACK_QUOTES = [
  "Let's get after it. Your future self is watching.",
  "Progressive overload is the only cheat code.",
  "Show up. That's 80% of the job done.",
  "Every rep is a vote for the person you're becoming.",
  "Soreness is weakness leaving the body. Welcome it.",
  "Consistency beats intensity. Every. Single. Time.",
  "The hardest step is walking through the gym door.",
]

export function useBrunoQuote(): string {
  const today     = todayISO()
  const cacheKey  = `bruno_quote:${today}`
  const [quote, setQuote] = useState<string>(() => {
    // Check localStorage cache first
    const cached = lsGet<string>(cacheKey)
    if (cached) return cached
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
  })

  useEffect(() => {
    const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
    if (!workerUrl) return

    // Check localStorage cache
    const cached = lsGet<string>(cacheKey)
    if (cached) { setQuote(cached); return }

    fetch(`${workerUrl}/api/quote`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { quote?: string } | null) => {
        if (data?.quote) {
          setQuote(data.quote)
          localStorage.setItem(cacheKey, JSON.stringify(data.quote))
        }
      })
      .catch(() => { /* keep fallback */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return quote
}
