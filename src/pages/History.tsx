import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { loadAllSessions, type SessionData } from '../lib/storage'
import { getExerciseById, MUSCLE_GROUP_LABELS } from '../data/exercises'
import { formatDate } from '../lib/dates'
import BottomNav from '../components/BottomNav'

export default function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Array<{ date: string; session: SessionData }>>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setSessions(loadAllSessions())
  }, [])

  return (
    <div className="min-h-screen bg-navy flex flex-col pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-blue-dark/40 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-off-white" />
        </button>
        <h1 className="font-heading text-3xl text-off-white tracking-wide">HISTORY</h1>
      </div>

      <div className="flex-1 px-5">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-4">🐻</div>
            <p className="text-off-white/50">No sessions yet.</p>
            <p className="text-off-white/30 text-sm mt-1">Complete your first workout to see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(({ date, session }) => {
              const isOpen = expanded === date
              const totalVolume = session.weights
                ? session.weights.reduce(
                    (acc, sets, i) =>
                      acc +
                      sets.reduce(
                        (a, w, j) => a + w * (session.reps?.[i]?.[j] ?? 0),
                        0
                      ),
                    0
                  )
                : 0

              return (
                <button
                  key={date}
                  onClick={() => setExpanded(isOpen ? null : date)}
                  className={`w-full text-left rounded-2xl border transition-all
                    ${isOpen
                      ? 'border-red-elec/40 bg-red-elec/5'
                      : 'border-blue-dark/60 bg-blue-dark/20 hover:border-off-white/20'
                    }`}
                >
                  {/* Summary row */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-off-white">{formatDate(date)}</div>
                      <div className="text-off-white/50 text-xs mt-0.5">
                        {session.exercises.length} exercises
                        {session.duration ? ` · ${Math.round(session.duration / 60)} min` : ''}
                        {totalVolume > 0 ? ` · ${Math.round(totalVolume).toLocaleString()} kg vol` : ''}
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-off-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-blue-dark/40 pt-4 space-y-3">
                      {session.exercises.map((exId, i) => {
                        const ex = getExerciseById(exId)
                        const weights = session.weights?.[i] ?? []
                        const reps    = session.reps?.[i] ?? []
                        return (
                          <div key={exId}>
                            <div className="font-medium text-off-white text-sm">
                              {ex?.name ?? exId}
                              <span className="text-off-white/40 font-normal ml-2 text-xs">
                                {ex ? MUSCLE_GROUP_LABELS[ex.muscleGroup] : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {weights.map((w, j) => (
                                <span
                                  key={j}
                                  className="bg-blue-dark/50 text-off-white/70 text-xs px-2.5 py-1 rounded-lg"
                                >
                                  {w} kg × {reps[j]}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                      {session.note ? (
                        <p className="text-off-white/40 text-xs italic border-t border-blue-dark/40 pt-3">
                          "{session.note}"
                        </p>
                      ) : null}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
