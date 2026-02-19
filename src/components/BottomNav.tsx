import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, Clock, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/home',     Icon: Home,     label: 'Home'     },
  { path: '/library',  Icon: Dumbbell, label: 'Library'  },
  { path: '/progress', Icon: BarChart2, label: 'Progress' },
  { path: '/history',  Icon: Clock,    label: 'History'  },
  { path: '/settings', Icon: Settings,  label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy border-t border-blue-dark/60
      flex items-center justify-around px-2 pb-safe z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      {NAV_ITEMS.map(({ path, Icon, label }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 py-3 px-4 min-w-[44px] min-h-[44px]
              transition-colors rounded-xl
              ${active ? 'text-red-elec' : 'text-off-white/40 hover:text-off-white/70'}`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
            <span className={`text-[10px] font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
