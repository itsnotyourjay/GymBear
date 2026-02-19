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

// Accessory unlocked at each level
const ACCESSORY_UNLOCKS: Record<number, string> = {
  2: 'gym_bag',
  3: 'sunglasses',
  4: 'headband',
  5: 'chalk',
  6: 'gold_chain',
  7: 'backwards_cap',
  8: 'protein_shaker',
}

const XP_PER_LEVEL = 500

interface GymBearStore {
  // User
  userProfile: UserProfile
  setUserProfile: (p: Partial<UserProfile>) => void

  // Bruno
  bruno: BrunoState
  setBrunoAnimation: (state: BrunoState['animationState']) => void
  setActiveAccessory: (accessory: string | null) => void
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

      setActiveAccessory: (accessory) =>
        set((s) => ({ bruno: { ...s.bruno, activeAccessory: accessory } })),

      addBrunoXP: (xp) => {
        const current = get().bruno
        const newXP    = current.xp + xp
        const oldLevel = current.level
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1
        const newUnlocked = [...current.unlockedAccessories]

        // Unlock accessories for each newly reached level
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const unlock = ACCESSORY_UNLOCKS[lvl]
          if (unlock && !newUnlocked.includes(unlock)) newUnlocked.push(unlock)
        }

        const leveledUp = newLevel > oldLevel
        set((s) => ({
          bruno: {
            ...s.bruno,
            xp:                  newXP,
            level:               newLevel,
            unlockedAccessories: newUnlocked,
            animationState:      leveledUp ? 'level-up' : s.bruno.animationState,
          },
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
