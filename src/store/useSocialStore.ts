/**
 * useSocialStore — Enhancement §8.2
 * Ghost races + community challenges.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { lsSet, loadAllSessions } from '../lib/storage'

export interface GhostExercise {
  exerciseId: string
  sets: { weight: number; reps: number }[]
}

export interface GhostSession {
  id: string
  sessionDate: string
  nickname: string
  exercises: GhostExercise[]
  totalVolume: number
  duration: number
}

export interface CommunityChallenge {
  id: string
  title: string
  description: string
  metric: string
  target: number
  endsAt: string
  participantCount: number
  userProgress: number
  joined: boolean
}

interface SocialStore {
  ghosts: GhostSession[]
  activeGhost: GhostSession | null
  communityChallenge: CommunityChallenge | null
  saveSessionAsGhost: (sessionDate: string, nickname?: string) => void
  setActiveGhost: (id: string | null) => void
  fetchCommunityChallenge: () => Promise<void>
  updateChallengeProgress: (progress: number) => void
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      ghosts: [],
      activeGhost: null,
      communityChallenge: null,

      saveSessionAsGhost: (sessionDate, nickname) => {
        const sessions = loadAllSessions()
        const found = sessions.find((s) => s.date === sessionDate)
        if (!found) return

        const { session } = found
        const totalVolume = session.weights?.reduce(
          (a: number, setWeights: number[], i: number) =>
            a + setWeights.reduce((b: number, w: number, j: number) => b + w * (session.reps?.[i]?.[j] ?? 0), 0),
          0
        ) ?? 0

        const ghost: GhostSession = {
          id: `ghost-${sessionDate}-${Date.now()}`,
          sessionDate,
          nickname: nickname ?? `${new Date(sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} You`,
          exercises: (session.exercises as string[]).map((exId: string, i: number) => ({
            exerciseId: exId,
            sets: (session.weights?.[i] ?? []).map((w: number, j: number) => ({
              weight: w,
              reps: session.reps?.[i]?.[j] ?? 0,
            })),
          })),
          totalVolume,
          duration: session.duration,
        }

        const updated = [ghost, ...get().ghosts].slice(0, 10) // keep last 10
        lsSet('social:ghosts', updated)
        set({ ghosts: updated })
      },

      setActiveGhost: (id) => {
        const ghost = id ? get().ghosts.find((g) => g.id === id) ?? null : null
        set({ activeGhost: ghost })
      },

      fetchCommunityChallenge: async () => {
        const workerUrl = import.meta.env.VITE_WORKER_URL as string | undefined
        if (!workerUrl) return
        try {
          const res = await fetch(`${workerUrl}/api/challenge`)
          if (!res.ok) return
          const data = await res.json() as CommunityChallenge
          set({ communityChallenge: { ...data, userProgress: 0, joined: false } })
        } catch { /* silent */ }
      },

      updateChallengeProgress: (progress) => {
        set((s) => ({
          communityChallenge: s.communityChallenge
            ? { ...s.communityChallenge, userProgress: progress }
            : null,
        }))
      },
    }),
    { name: 'gymbear-social' }
  )
)
