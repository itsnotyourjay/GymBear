import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// PRD Section 10 — Data Schema

export interface UserProfile {
  goal: 'strength' | 'hypertrophy' | 'general_fitness' | null
  gymDays: string[]          // e.g. ['monday','wednesday','friday']
  duration: 30 | 45 | 60 | null
  machineIncrements: {
    chest: number            // default 5
    lat: number              // default 5
    leg: number              // default 10
  }
  pinHash: string | null
  onboardingComplete: boolean
  createdAt: string | null
}

export interface BrunoState {
  level: number
  xp: number
  unlockedAccessories: string[]
  activeAccessory: string | null
  name: string               // default 'Bruno'
  animationState:
    | 'idle'
    | 'pre-workout'
    | 'set-complete'
    | 'rest-timer'
    | 'pr-achieved'
    | 'session-complete'
    | 'rest-day'
    | 'loading'
    | 'level-up'
}

interface GymBearStore {
  // User
  userProfile: UserProfile
  setUserProfile: (p: Partial<UserProfile>) => void

  // Bruno
  bruno: BrunoState
  setBrunoAnimation: (state: BrunoState['animationState']) => void
  addBrunoXP: (xp: number) => void

  // App state
  isOnboarded: boolean
  setOnboarded: () => void
}

const defaultProfile: UserProfile = {
  goal: null,
  gymDays: [],
  duration: null,
  machineIncrements: { chest: 5, lat: 5, leg: 10 },
  pinHash: null,
  onboardingComplete: false,
  createdAt: null,
}

const defaultBruno: BrunoState = {
  level: 1,
  xp: 0,
  unlockedAccessories: [],
  activeAccessory: null,
  name: 'Bruno',
  animationState: 'idle',
}

export const useGymBearStore = create<GymBearStore>()(
  persist(
    (set, get) => ({
      userProfile: defaultProfile,
      setUserProfile: (p) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...p } })),

      bruno: defaultBruno,
      setBrunoAnimation: (state) =>
        set((s) => ({ bruno: { ...s.bruno, animationState: state } })),
      addBrunoXP: (xp) => {
        const current = get().bruno
        const newXP = current.xp + xp
        // Level up every 500 XP
        const newLevel = Math.floor(newXP / 500) + 1
        set((s) => ({
          bruno: { ...s.bruno, xp: newXP, level: newLevel },
        }))
      },

      isOnboarded: false,
      setOnboarded: () => set({ isOnboarded: true }),
    }),
    {
      name: 'gymbear-store',
    }
  )
)
