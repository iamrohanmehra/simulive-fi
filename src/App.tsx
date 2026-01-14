import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SessionPage from '@/pages/SessionPage';
import { Toaster } from 'sonner';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/session/:sessionId" element={<SessionPage />} />
        {/* Default redirect to a demo session or 404 for now */}
        <Route path="/" element={<div className="p-10 text-center">Welcome to Simulive. Please provide a session ID.</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;