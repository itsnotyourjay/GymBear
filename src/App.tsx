import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Phase 1 placeholder screens — replaced in Phase 2+
function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-5xl text-red-elec font-heading mb-4">🐻 GymBear</h1>
      <p className="text-off-white text-xl opacity-60">{name}</p>
      <p className="text-off-white text-sm opacity-30 mt-2">Phase 1 scaffold — under construction</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy">
        <Routes>
          <Route path="/"          element={<PlaceholderScreen name="PIN Lock" />} />
          <Route path="/onboarding" element={<PlaceholderScreen name="Onboarding" />} />
          <Route path="/home"      element={<PlaceholderScreen name="Home Dashboard" />} />
          <Route path="/workout"   element={<PlaceholderScreen name="Active Workout" />} />
          <Route path="/history"   element={<PlaceholderScreen name="History" />} />
          <Route path="/progress"  element={<PlaceholderScreen name="Progress Hub" />} />
          <Route path="/library"   element={<PlaceholderScreen name="Exercise Library" />} />
          <Route path="/wardrobe"  element={<PlaceholderScreen name="Bruno Wardrobe" />} />
          <Route path="/settings"  element={<PlaceholderScreen name="Settings" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
