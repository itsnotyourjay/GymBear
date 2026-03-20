/**
 * coachAI.ts — Enhancement §6.4
 * Fetches 2–3 AI coaching insights from the Cloudflare Worker.
 * Runs at most once per 24h (rate-limiting is enforced in useCoachStore).
 */
import type { CoachInsight } from '../store/useCoachStore'
import { loadAllSessions, loadPR } from './storage'
import { useGymBearStore } from '../store/useGymBearStore'
import { EXERCISES } from '../data/exercises'
import { todayISO } from './dates'

export async function runCoachAI(existingRuleInsights: CoachInsight[]): Promise<CoachInsight[]> {
  const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
  if (!workerUrl) return []

  const profile = useGymBearStore.getState().userProfile
  const sessions = loadAllSessions().slice(0, 5)
  const prs: Record<string, { bestWeight: number; bestReps: number; date: string }> = {}
  for (const ex of EXERCISES) {
    const pr = loadPR(ex.id)
    if (pr) prs[ex.id] = pr
  }

  try {
    const res = await fetch(`${workerUrl}/api/plan`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode:    'coach',
        profile,
        recentSessions: sessions.map(({ date, session }) => ({
          date,
          exercises: (session.exercises as string[]).map((id, i) => ({
            id,
            lastWeight: (session.weights?.[i] ?? []).slice(-1)[0] ?? null,
            lastReps:   (session.reps?.[i] ?? []).slice(-1)[0] ?? null,
          })),
        })),
        prs,
        insights: existingRuleInsights,
      }),
    })

    if (!res.ok) return []

    const data = await res.json() as CoachInsight[]
    const today = todayISO()

    if (!Array.isArray(data)) return []

    return data.map((item, idx) => ({
      ...item,
      id:          item.id ?? `ai-${today}-${idx}`,
      generatedAt: today,
      dismissed:   false,
      source:      'ai' as const,
    }))
  } catch {
    return []
  }
}
