import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { EXERCISES, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from '../data/exercises'

export default function ExerciseLibrary() {
  const navigate = useNavigate()
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState<MuscleGroup | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchesGroup = filter === 'all' || ex.muscleGroup === filter
      const matchesQuery =
        query === '' ||
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(query.toLowerCase())
      return matchesGroup && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-blue-dark/40 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-off-white" />
          </button>
          <h1 className="font-heading text-3xl text-off-white tracking-wide">EXERCISE LIBRARY</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-off-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full bg-blue-dark/40 text-off-white placeholder-off-white/30
              pl-9 pr-4 py-3 rounded-xl outline-none border border-transparent
              focus:border-red-elec transition-colors"
          />
        </div>

        {/* Muscle group filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterChip
            label="All"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {MUSCLE_GROUPS.map((mg) => (
            <FilterChip
              key={mg}
              label={MUSCLE_GROUP_LABELS[mg]}
              active={filter === mg}
              onClick={() => setFilter(mg)}
            />
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">
        <p className="text-off-white/40 text-xs mb-3">{filtered.length} exercises</p>
        <div className="flex flex-col gap-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(selected === ex.id ? null : ex.id)}
              className={`w-full text-left px-4 py-4 rounded-2xl border transition-all
                ${selected === ex.id
                  ? 'border-red-elec bg-red-elec/10'
                  : 'border-blue-dark/60 bg-blue-dark/20 hover:border-off-white/20'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-off-white">{ex.name}</div>
                  <div className="text-off-white/50 text-xs mt-0.5">
                    {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {ex.equipment}
                    {ex.isCompound && (
                      <span className="ml-2 text-gold">compound</span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-off-white/40 transition-transform ${
                    selected === ex.id ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Expanded detail */}
              {selected === ex.id && (
                <div className="mt-3 pt-3 border-t border-off-white/10">
                  <div className="text-off-white/60 text-sm mb-2">{ex.equipmentNote}</div>
                  <div className="text-off-white/50 text-xs mb-2">
                    Default: {ex.defaultSets} sets × {ex.defaultReps}
                  </div>
                  {ex.tips && (
                    <p className="text-xs text-off-white/60 leading-relaxed">{ex.tips}</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
        ${active
          ? 'bg-red-elec text-off-white'
          : 'bg-blue-dark/40 text-off-white/60 hover:bg-blue-dark/70'
        }`}
    >
      {label}
    </button>
  )
}
