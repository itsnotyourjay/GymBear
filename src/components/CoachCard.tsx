/**
 * CoachCard — Enhancement §6.5
 * Swipeable coaching insight card with type-coded left border.
 */
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lightbulb, Trophy, Heart, X, ArrowRight } from 'lucide-react'
import { useCoachStore } from '../store/useCoachStore'
import type { CoachInsight } from '../store/useCoachStore'

const TYPE_CONFIG = {
  warning:     { color: '#FF3D5A', Icon: AlertTriangle },
  suggestion:  { color: '#7B5EFF', Icon: Lightbulb    },
  encouragement:{ color: '#00F5C4', Icon: Heart        },
  milestone:   { color: '#FFD700', Icon: Trophy        },
}

function Card({ insight, onDismiss }: { insight: CoachInsight; onDismiss: () => void }) {
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, -60, 0], [0, 0.6, 1])
  const { color, Icon } = TYPE_CONFIG[insight.type]

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -200, right: 10 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.x < -80) onDismiss()
      }}
      className="glass relative overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ borderLeft: `4px solid ${color}`, x, opacity }}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${color}22` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-bear-bright text-sm font-semibold leading-snug">{insight.title}</p>
          <p className="text-bear-text text-xs mt-0.5 leading-relaxed line-clamp-2">{insight.body}</p>
          {insight.actionLabel && insight.actionRoute && (
            <button
              onClick={() => navigate(insight.actionRoute!)}
              className="flex items-center gap-1 mt-2 text-xs font-medium"
              style={{ color }}
            >
              {insight.actionLabel} <ArrowRight size={11} />
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-bear-muted hover:text-bear-text transition-colors ml-1 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
      {/* Swipe hint */}
      <p className="text-bear-muted text-[9px] px-4 pb-2 text-right select-none">
        Swipe left to dismiss
      </p>
    </motion.div>
  )
}

export default function CoachCard() {
  const { insights, dismissInsight } = useCoachStore()
  const active = insights.filter((i) => !i.dismissed)

  if (active.length === 0) return null

  const top    = active[0]
  const second = active[1]

  return (
    <div className="relative">
      {/* Stack peek */}
      {second && (
        <div
          className="glass absolute inset-x-2 -bottom-1.5 h-4 opacity-30 rounded-2xl"
          style={{ zIndex: 0 }}
        />
      )}

      <AnimatePresence mode="popLayout">
        <Card
          key={top.id}
          insight={top}
          onDismiss={() => dismissInsight(top.id)}
        />
      </AnimatePresence>
    </div>
  )
}
