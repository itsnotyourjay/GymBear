/**
 * Confetti — Enhancement §3.4
 * Lightweight CSS-particle confetti burst. No external lib needed.
 * Spawns `count` motion.div particles from a given origin point.
 */
import { motion } from 'framer-motion'

interface ConfettiProps {
  count?: number
  colors?: string[]
  origin?: { x: number; y: number }
}

const DEFAULT_COLORS = ['#FF3D5A', '#7B5EFF', '#FFD700', '#00F5C4']

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function Confetti({
  count = 30,
  colors = DEFAULT_COLORS,
  origin = { x: 0, y: 0 },
}: ConfettiProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x:     randomBetween(-160, 160),
    y:     randomBetween(-240, -60),
    rotate:randomBetween(-360, 360),
    scale: randomBetween(0.6, 1.2),
    size:  randomBetween(6, 12),
    delay: randomBetween(0, 0.2),
  }))

  return (
    <div
      className="pointer-events-none fixed z-[9000]"
      style={{ left: origin.x, top: origin.y }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            left: 0,
            top: 0,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: p.scale, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            rotate: p.rotate,
            scale: 0,
          }}
          transition={{
            duration: randomBetween(0.8, 1.4),
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  )
}
