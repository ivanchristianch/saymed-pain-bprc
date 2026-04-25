import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import EncounterDetail from './pages/EncounterDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/patients" element={
          <ProtectedRoute><Patients /></ProtectedRoute>
        } />

        <Route path="/patients/:id" element={
          <ProtectedRoute><PatientDetail /></ProtectedRoute>
   } />

        <Route path="/encounters/:id" element={
          <ProtectedRoute><EncounterDetail /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
