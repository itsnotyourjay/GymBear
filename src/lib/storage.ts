/**
 * GymBear Storage Layer
 * PRD Section 6.5 — Cloudflare KV + localStorage offline-first sync
 *
 * Strategy:
 *  - All reads/writes go to localStorage FIRST (instant, offline-safe)
 *  - KV sync happens in background when online
 *  - On reconnect, pending writes flush to KV
 */

import type { UserProfile, BrunoState } from '../store/useGymBearStore'

// ── Key schema (PRD Section 10) ──────────────────────────────────────────────
export const KV_KEYS = {
  userProfile:    'user:profile',
  userBruno:      'user:bruno',
  streakCurrent:  'streak:current',
  streakBest:     'streak:best',
  plan:           (date: string) => `plan:${date}`,
  session:        (date: string) => `session:${date}`,
  pr:             (exerciseId: string) => `pr:${exerciseId}`,
} as const

// ── Worker API base URL ───────────────────────────────────────────────────────
// In dev, proxied via Vite. In prod, same origin via Cloudflare.
const WORKER_BASE = import.meta.env.VITE_WORKER_URL ?? ''

// ── LocalStorage helpers ─────────────────────────────────────────────────────
export function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    // Track as pending sync
    const pending = lsGet<string[]>('__pending_sync') ?? []
    if (!pending.includes(key)) {
      lsSet('__pending_sync', [...pending, key])
    }
  } catch (err) {
    console.warn('[GymBear] localStorage write failed:', err)
  }
}

export function lsRemove(key: string): void {
  localStorage.removeItem(key)
}

// ── KV sync via Worker ────────────────────────────────────────────────────────
async function kvWrite(key: string, value: unknown): Promise<void> {
  if (!navigator.onLine) return
  try {
    await fetch(`${WORKER_BASE}/api/kv/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    // Remove from pending
    const pending = lsGet<string[]>('__pending_sync') ?? []
    lsSet('__pending_sync', pending.filter((k) => k !== key))
  } catch {
    // Silent — will retry on next sync
  }
}

async function kvRead<T>(key: string): Promise<T | null> {
  if (!navigator.onLine) return null
  try {
    const res = await fetch(`${WORKER_BASE}/api/kv/${encodeURIComponent(key)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data as T
  } catch {
    return null
  }
}

// ── Flush pending writes when back online ─────────────────────────────────────
export function setupSyncOnReconnect(): void {
  window.addEventListener('online', async () => {
    const pending = lsGet<string[]>('__pending_sync') ?? []
    for (const key of pending) {
      const value = lsGet(key)
      if (value !== null) {
        await kvWrite(key, value)
      }
    }
  })
}

// ── Typed storage API ─────────────────────────────────────────────────────────

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  lsSet(KV_KEYS.userProfile, profile)
  await kvWrite(KV_KEYS.userProfile, profile)
}

export function loadUserProfile(): UserProfile | null {
  return lsGet<UserProfile>(KV_KEYS.userProfile)
}

export async function saveBrunoState(bruno: BrunoState): Promise<void> {
  lsSet(KV_KEYS.userBruno, bruno)
  await kvWrite(KV_KEYS.userBruno, bruno)
}

export function loadBrunoState(): BrunoState | null {
  return lsGet<BrunoState>(KV_KEYS.userBruno)
}

export async function saveStreak(current: number, best: number): Promise<void> {
  lsSet(KV_KEYS.streakCurrent, current)
  lsSet(KV_KEYS.streakBest, best)
  await kvWrite(KV_KEYS.streakCurrent, current)
  await kvWrite(KV_KEYS.streakBest, best)
}

export function loadStreak(): { current: number; best: number } {
  return {
    current: lsGet<number>(KV_KEYS.streakCurrent) ?? 0,
    best:    lsGet<number>(KV_KEYS.streakBest) ?? 0,
  }
}

export interface SessionData {
  exercises: string[]
  sets: number[][]
  reps: number[][]
  weights: number[][]
  duration: number
  note: string
  timestamp: string
}

export async function saveSession(date: string, session: SessionData): Promise<void> {
  lsSet(KV_KEYS.session(date), session)
  await kvWrite(KV_KEYS.session(date), session)
}

export function loadSession(date: string): SessionData | null {
  return lsGet<SessionData>(KV_KEYS.session(date))
}

export function loadAllSessions(): Array<{ date: string; session: SessionData }> {
  const results: Array<{ date: string; session: SessionData }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('session:')) {
      const date = key.replace('session:', '')
      const session = lsGet<SessionData>(key)
      if (session) results.push({ date, session })
    }
  }
  return results.sort((a, b) => b.date.localeCompare(a.date))
}

export interface PRData {
  bestWeight: number
  bestReps: number
  date: string
}

export async function savePR(exerciseId: string, pr: PRData): Promise<void> {
  lsSet(KV_KEYS.pr(exerciseId), pr)
  await kvWrite(KV_KEYS.pr(exerciseId), pr)
}

export function loadPR(exerciseId: string): PRData | null {
  return lsGet<PRData>(KV_KEYS.pr(exerciseId))
}

// ── Hydrate store from localStorage on app start ──────────────────────────────
export async function hydrateFromStorage(): Promise<{
  profile: UserProfile | null
  bruno: BrunoState | null
  streak: { current: number; best: number }
}> {
  const profile = loadUserProfile()
  const bruno   = loadBrunoState()
  const streak  = loadStreak()

  // If online, try to get fresher data from KV
  if (navigator.onLine && profile) {
    const remoteProfile = await kvRead<UserProfile>(KV_KEYS.userProfile)
    if (remoteProfile) {
      lsSet(KV_KEYS.userProfile, remoteProfile)
      return { profile: remoteProfile, bruno, streak }
    }
  }

  return { profile, bruno, streak }
}

// ── Clear all data (Settings → Clear All) ─────────────────────────────────────
export function clearAllLocalData(): void {
  localStorage.clear()
}
