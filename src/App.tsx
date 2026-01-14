import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SessionPage from '@/pages/SessionPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SessionsListPage from '@/pages/SessionsListPage';
import { Toaster } from 'sonner';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SessionsListPage />} />
        <Route path="/session/:sessionId" element={<SessionPage />} />
        <Route path="/analytics/:sessionId" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;