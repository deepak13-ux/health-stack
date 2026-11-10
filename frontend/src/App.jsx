import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, homeFor } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientHome from './pages/patient/PatientHome';
import FindDoctors from './pages/patient/FindDoctors';
import MyAppointments from './pages/patient/MyAppointments';
import MyRecords from './pages/patient/MyRecords';
import Schedule from './pages/staff/Schedule';
import Pharmacy from './pages/staff/Pharmacy';

function Root() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<Root />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute roles={['patient']} />}>
      <Route path="/patient" element={<Layout />}>
        <Route index element={<PatientHome />} />
        <Route path="doctors" element={<FindDoctors />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="records" element={<MyRecords />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['doctor']} />}>
      <Route path="/staff" element={<Layout />}>
        <Route index element={<Schedule />} />
        <Route path="schedule" element={<Navigate to="/staff" replace />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['pharmacist']} />}>
      <Route path="/pharmacy" element={<Layout />}><Route index element={<Pharmacy />} /></Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></AuthProvider>;
}
