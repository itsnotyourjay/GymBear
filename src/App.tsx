import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGymBearStore } from './store/useGymBearStore'
import { setupSyncOnReconnect } from './lib/storage'
import A2HSPrompt from './components/A2HSPrompt'
import Onboarding from './pages/Onboarding'
import PinLock from './pages/PinLock'
import Home from './pages/Home'
import Workout from './pages/Workout'

// Lazy-loaded pages (reduces initial bundle)
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'))
const History         = lazy(() => import('./pages/History'))
const Wardrobe        = lazy(() => import('./pages/Wardrobe'))
const Progress        = lazy(() => import('./pages/Progress'))
const Settings        = lazy(() => import('./pages/Settings'))
const PlanBuilder     = lazy(() => import('./pages/PlanBuilder'))
const SessionComplete = lazy(() => import('./pages/SessionComplete'))

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
            <Route path="/home"          element={<Home />} />
            <Route path="/workout"       element={<Workout />} />
            <Route path="/history"       element={<History />} />
            <Route path="/progress"      element={<Progress />} />
            <Route path="/library"       element={<ExerciseLibrary />} />
            <Route path="/wardrobe"      element={<Wardrobe />} />
            <Route path="/settings"      element={<Settings />} />
            <Route path="/plan-builder"  element={<PlanBuilder />} />
            <Route path="/session-complete" element={<SessionComplete />} />
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
        <A2HSPrompt />
      </div>
    </BrowserRouter>
  )
}
