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
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div
        className="glass mx-auto max-w-lg flex items-center justify-around overflow-hidden relative"
        style={{
          height: 72,
          borderRadius: '36px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
        }}
      >
        {NAV_ITEMS.map(({ path, Icon, label }, idx) => {
          const active = location.pathname === path
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full z-10"
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Active physical indicator pill behind icon */}
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-y-2 inset-x-3 rounded-full bg-white/10"
                  style={{ backdropFilter: 'blur(8px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={active ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                className="relative z-10"
              >
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 1.5}
                  className={active ? 'text-white' : 'text-bear-text/60'}
                />
              </motion.div>

              {/* Label animates in only for active */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="text-[10px] font-medium tracking-wide text-white leading-none z-10"
                  >
                    {label}
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
