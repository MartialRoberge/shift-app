import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SelectRole } from '@/routes/SelectRole'
import { WorkerHome } from '@/routes/WorkerHome'
import { AgencyHome } from '@/routes/AgencyHome'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/select-role" replace />} />
        <Route path="/select-role" element={<SelectRole />} />

        {/* Worker */}
        <Route path="/worker" element={<WorkerHome />} />

        {/* Agency */}
        <Route path="/agency" element={<AgencyHome />} />

        {/* Fallback for old employer route */}
        <Route path="/employer" element={<Navigate to="/agency" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
