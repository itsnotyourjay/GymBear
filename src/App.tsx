import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGymBearStore } from './store/useGymBearStore'
import { setupSyncOnReconnect } from './lib/storage'
import Onboarding from './pages/Onboarding'
import PinLock from './pages/PinLock'
import Home from './pages/Home'
import Workout from './pages/Workout'

// Lazy-loaded pages (reduces initial bundle)
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'))
const History         = lazy(() => import('./pages/History'))
const Wardrobe        = lazy(() => import('./pages/Wardrobe'))
const Progress        = lazy(() => import('./pages/Progress'))

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <h1 className="text-5xl text-red-elec font-heading mb-4">🐻 GymBear</h1>
      <p className="text-off-white text-xl opacity-60">{name}</p>
      <p className="text-off-white text-sm opacity-30 mt-2">Coming soon…</p>
    </div>
  )
}

const slideVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0,  opacity: 1 },
  exit:    { x: -24, opacity: 0 },
}

function AnimatedRoutes() {
  const location    = useLocation()
  const isOnboarded = useGymBearStore((s) => s.userProfile?.onboardingComplete)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        style={{ minHeight: '100vh' }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-off-white/40 text-sm">Loading…</div>
          </div>
        }>
          <Routes location={location}>
            <Route
              path="/"
              element={isOnboarded ? <PinLock /> : <Navigate to="/onboarding" replace />}
            />
            <Route
              path="/onboarding"
              element={isOnboarded ? <Navigate to="/" replace /> : <Onboarding />}
            />
            <Route path="/home"     element={<Home />} />
            <Route path="/workout"  element={<Workout />} />
            <Route path="/history"  element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/library"  element={<ExerciseLibrary />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/settings" element={<PlaceholderScreen name="Settings" />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  useEffect(() => {
    setupSyncOnReconnect()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}
