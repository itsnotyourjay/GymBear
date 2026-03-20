/**
 * useCoachStore — Enhancement §6.2
 * Adaptive smart coaching engine state.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { lsSet, lsGet } from '../lib/storage'

export interface CoachInsight {
  id: string
  type: 'warning' | 'encouragement' | 'suggestion' | 'milestone'
  title: string
  body: string
  actionLabel?: string
  actionRoute?: string
  generatedAt: string // ISO date
  dismissed: boolean
  source: 'ai' | 'rule'
}

interface CoachStore {
  insights: CoachInsight[]
  lastAnalyzedAt: string | null
  isAnalyzing: boolean
  addInsight: (i: CoachInsight) => void
  dismissInsight: (id: string) => void
  clearDismissed: () => void
  setInsights: (insights: CoachInsight[]) => void
  setLastAnalyzedAt: (ts: string) => void
  setIsAnalyzing: (v: boolean) => void
  runAnalysis: () => Promise<void>
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      insights: [],
      lastAnalyzedAt: null,
      isAnalyzing: false,

      addInsight: (i) => {
        set((s) => {
          // Deduplicate by id
          const exists = s.insights.some((x) => x.id === i.id)
          if (exists) return s
          const updated = [i, ...s.insights].slice(0, 20) // cap at 20
          lsSet('coach:insights', updated)
          return { insights: updated }
        })
      },

      dismissInsight: (id) => {
        set((s) => {
          const updated = s.insights.map((i) =>
            i.id === id ? { ...i, dismissed: true } : i
          )
          lsSet('coach:insights', updated)
          return { insights: updated }
        })
      },

      clearDismissed: () => {
        set((s) => {
          const updated = s.insights.filter((i) => !i.dismissed)
          lsSet('coach:insights', updated)
          return { insights: updated }
        })
      },

      setInsights: (insights) => {
        lsSet('coach:insights', insights)
        set({ insights })
      },

      setLastAnalyzedAt: (ts) => set({ lastAnalyzedAt: ts }),
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      runAnalysis: async () => {
        const { isAnalyzing, lastAnalyzedAt, setIsAnalyzing, setLastAnalyzedAt } = get()
        if (isAnalyzing) return

        // Rate-limit: once per 24h
        if (lastAnalyzedAt) {
          const diff = Date.now() - new Date(lastAnalyzedAt).getTime()
          if (diff < 1000 * 60 * 60 * 24) return
        }

        setIsAnalyzing(true)
        try {
          const { runCoachRules }  = await import('../lib/coachRules')
          const { runCoachAI }     = await import('../lib/coachAI')
          const ruleInsights = runCoachRules()
          for (const i of ruleInsights) get().addInsight(i)
          const aiInsights = await runCoachAI(ruleInsights)
          for (const i of aiInsights) get().addInsight(i)
          setLastAnalyzedAt(new Date().toISOString())
        } finally {
          setIsAnalyzing(false)
        }
      },
    }),
    {
      name: 'gymbear-coach',
      // Restore persisted insights from localStorage on init
      onRehydrateStorage: () => (state) => {
        if (state) {
          const persisted = lsGet<CoachInsight[]>('coach:insights')
          if (persisted) state.insights = persisted
        }
      },
    }
  )
)
