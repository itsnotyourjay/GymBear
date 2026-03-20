/**
 * BottomNav — Enhancement §1.3 [REPLACE]
 * Glass nav bar with spring animations, shared-layout active pill,
 * and safe-area support for iPhone Safari.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Dumbbell, BarChart2, Shirt, MoreHorizontal } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/home',     Icon: Home,          label: 'Home'     },
  { path: '/workout',  Icon: Dumbbell,       label: 'Workout'  },
  { path: '/progress', Icon: BarChart2,      label: 'Progress' },
  { path: '/wardrobe', Icon: Shirt,          label: 'Wardrobe' },
  { path: '/settings', Icon: MoreHorizontal, label: 'More'     },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-2"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div
        className="glass mx-auto max-w-lg flex items-center justify-around"
        style={{
          height: 68,
          boxShadow: '0 0 24px rgba(123,94,255,0.20), 0 0 60px rgba(123,94,255,0.08)',
        }}
      >
        {NAV_ITEMS.map(({ path, Icon, label }, idx) => {
          const active = location.pathname === path
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Active indicator pill */}
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute top-1.5 w-8 h-1 rounded-full bg-ember"
                  style={{ boxShadow: '0 0 10px rgba(255,61,90,0.60)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon with bounce when active */}
              <motion.div
                animate={active ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={active ? 'text-ember' : 'text-bear-muted'}
                />
              </motion.div>

              {/* Label animates in only for active */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[9px] font-display tracking-wider text-ember leading-none"
                  >
                    {label.toUpperCase()}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
