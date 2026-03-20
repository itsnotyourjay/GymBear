/**
 * coachRules.ts — Enhancement §6.3
 * Local rule-based coaching insights (no API call).
 * Runs synchronously and returns CoachInsight[] to be merged into the store.
 */
import type { CoachInsight } from '../store/useCoachStore'
import { loadAllSessions, loadStreak, loadPR } from './storage'
import { EXERCISES } from '../data/exercises'
import { todayISO } from './dates'

function uid(rule: string): string {
  return `rule-${rule}-${new Date().toISOString().split('T')[0]}`
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function runCoachRules(): CoachInsight[] {
  const insights: CoachInsight[] = []
  const sessions = loadAllSessions()
  const streak   = loadStreak()
  const today    = todayISO()

  // ── Rule 1: No session in 3+ days ──────────────────────────────────────────
  if (sessions.length > 0) {
    const lastDate = sessions[0].date
    const days = daysSince(lastDate)
    if (streak.current === 0 && days >= 3) {
      insights.push({
        id:          uid('no-session-3d'),
        type:        'warning',
        title:       "Bruno misses you!",
        body:        `It's been ${days} days since your last workout. Getting back is the hardest part.`,
        actionLabel: 'Start Workout',
        actionRoute: '/workout',
        generatedAt: today,
        dismissed:   false,
        source:      'rule',
      })
    }
  }

  // ── Rule 2: Same muscle group 2 days in a row ──────────────────────────────
  if (sessions.length >= 2) {
    const last1 = sessions[0].session.exercises as string[]
    const last2 = sessions[1].session.exercises as string[]
    const mg1 = new Set(last1.map((id) => EXERCISES.find((e) => e.id === id)?.muscleGroup).filter(Boolean))
    const mg2 = new Set(last2.map((id) => EXERCISES.find((e) => e.id === id)?.muscleGroup).filter(Boolean))
    const overlap = [...mg1].filter((mg) => mg2.has(mg as never))
    if (overlap.length > 0) {
      insights.push({
        id:          uid('same-muscle-2d'),
        type:        'warning',
        title:       'Recovery Alert',
        body:        `You trained your ${overlap.join('/')} two sessions in a row. Consider switching muscle groups.`,
        generatedAt: today,
        dismissed:   false,
        source:      'rule',
      })
    }
  }

  // ── Rule 3: Volume plateau (same volume 4+ sessions for same exercise) ──────
  if (sessions.length >= 4) {
    const exId = sessions[0].session.exercises?.[0] as string | undefined
    if (exId) {
      const volumes = sessions.slice(0, 4).map(({ session }) => {
        const idx = (session.exercises as string[]).indexOf(exId)
        if (idx === -1) return 0
        const weights = (session.weights?.[idx] ?? []) as number[]
        const reps    = (session.reps?.[idx] ?? []) as number[]
        return weights.reduce((a, w, i) => a + w * (reps[i] ?? 0), 0)
      })
      if (new Set(volumes).size === 1 && volumes[0] > 0) {
        const ex = EXERCISES.find((e) => e.id === exId)
        insights.push({
          id:          uid('volume-plateau'),
          type:        'suggestion',
          title:       'Volume Plateau Detected',
          body:        `Your ${ex?.name ?? exId} volume has been the same for 4 sessions. Time to progress the weight!`,
          actionLabel: 'View Progress',
          actionRoute: '/progress',
          generatedAt: today,
          dismissed:   false,
          source:      'rule',
        })
      }
    }
  }

  // ── Rule 4: PR 3 sessions in a row ─────────────────────────────────────────
  if (sessions.length >= 3) {
    const last3PRDates = sessions.slice(0, 3).map(({ date }) => date)
    const prDates = EXERCISES.map((e) => loadPR(e.id)?.date).filter(Boolean) as string[]
    const recentPRs = last3PRDates.filter((d) => prDates.includes(d))
    if (recentPRs.length >= 3) {
      insights.push({
        id:          uid('pr-streak'),
        type:        'encouragement',
        title:       "You're on Fire! 🔥",
        body:        "PRs in 3 straight sessions! You're in an incredible growth phase — keep riding this momentum.",
        generatedAt: today,
        dismissed:   false,
        source:      'rule',
      })
    }
  }

  // ── Rule 5: Longest streak ever ───────────────────────────────────────────
  if (streak.current > 0 && streak.current > streak.best) {
    insights.push({
      id:          uid('new-streak-record'),
      type:        'milestone',
      title:       'Longest Streak Ever! 🏆',
      body:        `${streak.current} days straight — that's a new personal record. Bruno is incredibly proud.`,
      generatedAt: today,
      dismissed:   false,
      source:      'rule',
    })
  }

  // ── Rule 6: Approaching PR (within 5%) ────────────────────────────────────
  if (sessions.length > 0) {
    const lastSession = sessions[0].session
    for (let i = 0; i < (lastSession.exercises as string[]).length; i++) {
      const exId = (lastSession.exercises as string[])[i]
      const lastWeights = (lastSession.weights?.[i] ?? []) as number[]
      const maxLastWeight = Math.max(...lastWeights, 0)
      const pr = loadPR(exId)
      if (pr && maxLastWeight > 0 && maxLastWeight < pr.bestWeight) {
        const ratio = maxLastWeight / pr.bestWeight
        if (ratio >= 0.95) {
          const ex = EXERCISES.find((e) => e.id === exId)
          insights.push({
            id:          uid(`approaching-pr-${exId}`),
            type:        'encouragement',
            title:       'Almost There!',
            body:        `Your ${ex?.name ?? exId} is within 5% of your PR (${pr.bestWeight}kg). Go get it!`,
            actionLabel: 'Start Workout',
            actionRoute: '/workout',
            generatedAt: today,
            dismissed:   false,
            source:      'rule',
          })
          break // one approaching-PR message is enough
        }
      }
    }
  }

  return insights
}
