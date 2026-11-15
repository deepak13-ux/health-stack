import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { Forbidden, NotFound } from "./pages/System.jsx";
import Settings from "./pages/Settings.jsx";
import Overview from "./pages/overview/Overview.jsx";
import { DoctorQueue } from "./pages/appointments/DoctorQueue.jsx";
import { DoctorAppointment } from "./pages/appointments/DoctorAppointment.jsx";
import { PatientAppointments } from "./pages/appointments/PatientAppointments.jsx";
import { PatientAppointment } from "./pages/appointments/PatientAppointment.jsx";
import { DoctorDirectory } from "./pages/doctors/DoctorDirectory.jsx";
import { DoctorProfile } from "./pages/doctors/DoctorProfile.jsx";
import { Prescriptions } from "./pages/prescriptions/Prescriptions.jsx";
import { PatientBills } from "./pages/billing/PatientBills.jsx";
import { PharmacyBills } from "./pages/billing/PharmacyBills.jsx";
import { BillDetail } from "./pages/billing/BillDetail.jsx";

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// The same route shows a role-scoped screen; other roles see access denied.
function ByRole(views) {
  const { user } = useAuth();
  return views[user.role] ?? <Forbidden />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="appointments" element={<ByRole patient={<PatientAppointments />} doctor={<DoctorQueue />} />} />
                <Route path="appointments/:appointmentId" element={<ByRole patient={<PatientAppointment />} doctor={<DoctorAppointment />} />} />
                <Route path="doctors" element={<ByRole patient={<DoctorDirectory />} />} />
                <Route path="doctors/:doctorId" element={<ByRole patient={<DoctorProfile />} />} />
                <Route path="prescriptions" element={<ByRole patient={<Prescriptions />} />} />
                <Route path="billing" element={<ByRole patient={<PatientBills />} pharmacist={<PharmacyBills />} />} />
                <Route path="billing/:billId" element={<ByRole patient={<BillDetail />} pharmacist={<BillDetail />} />} />
                <Route path="settings" element={<Settings />} />
                <Route path="403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
