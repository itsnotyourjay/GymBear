import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useGymBearStore } from './store/useGymBearStore'
import { setupSyncOnReconnect } from './lib/storage'
import Onboarding from './pages/Onboarding'
import PinLock from './pages/PinLock'
import ExerciseLibrary from './pages/ExerciseLibrary'

// Placeholder for screens built in later phases
function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <h1 className="text-5xl text-red-elec font-heading mb-4">🐻 GymBear</h1>
      <p className="text-off-white text-xl opacity-60">{name}</p>
      <p className="text-off-white text-sm opacity-30 mt-2">Coming soon…</p>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    setupSyncOnReconnect()
  }, [])

  const isOnboarded = useGymBearStore((s) => s.userProfile?.onboardingComplete)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy">
        <Routes>
          {/* Root → PIN lock if onboarded, onboarding if new */}
          <Route
            path="/"
            element={isOnboarded ? <PinLock /> : <Navigate to="/onboarding" replace />}
          />

          {/* Onboarding (only for new users) */}
          <Route
            path="/onboarding"
            element={isOnboarded ? <Navigate to="/" replace /> : <Onboarding />}
          />

          {/* Main app screens */}
          <Route path="/home"     element={<PlaceholderScreen name="Home Dashboard" />} />
          <Route path="/workout"  element={<PlaceholderScreen name="Active Workout" />} />
          <Route path="/history"  element={<PlaceholderScreen name="History" />} />
          <Route path="/progress" element={<PlaceholderScreen name="Progress Hub" />} />
          <Route path="/library"  element={<ExerciseLibrary />} />
          <Route path="/wardrobe" element={<PlaceholderScreen name="Bruno Wardrobe" />} />
          <Route path="/settings" element={<PlaceholderScreen name="Settings" />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
