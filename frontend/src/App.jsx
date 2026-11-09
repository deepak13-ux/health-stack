import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth, homeFor } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import PatientHome from "./pages/patient/PatientHome";
import FindDoctors from "./pages/patient/FindDoctors";
import MyAppointments from "./pages/patient/MyAppointments";
import MyRecords from "./pages/patient/MyRecords";
import StaffHome from "./pages/staff/StaffHome";
import Schedule from "./pages/staff/Schedule";
import StaffAdmissions from "./pages/staff/Admissions";
import MyEmployment from "./pages/staff/MyEmployment";
import AdminHome from "./pages/admin/AdminHome";
import Patients from "./pages/admin/Patients";
import PatientProfile from "./pages/admin/PatientProfile";
import Appointments from "./pages/admin/Appointments";
import Doctors from "./pages/admin/Doctors";
import Employees from "./pages/admin/Employees";
import Admissions from "./pages/admin/Admissions";
import Billing from "./pages/admin/Billing";
import InvoiceForm from "./pages/admin/InvoiceForm";
import InvoiceDetail from "./pages/admin/InvoiceDetail";
import Reports from "./pages/admin/Reports";

function Root() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user) : "/login"} replace />;
}
const ALL = ["patient", "doctor", "nurse", "admin", "receptionist"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute roles={["patient"]} />}>
            <Route path="/patient" element={<Layout />}>
              <Route index element={<PatientHome />} />
              <Route path="doctors" element={<FindDoctors />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="records" element={<MyRecords />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["doctor", "nurse"]} />}>
            <Route path="/staff" element={<Layout />}>
              <Route index element={<StaffHome />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="admissions" element={<StaffAdmissions />} />
              <Route path="employment" element={<MyEmployment />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["admin", "receptionist"]} />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<AdminHome />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="admissions" element={<Admissions />} />
              <Route path="billing" element={<Billing />} />
              <Route path="billing/new" element={<InvoiceForm />} />
              <Route path="billing/:id" element={<InvoiceDetail />} />
              <Route path="billing/:id/edit" element={<InvoiceForm />} />
              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route path="employees" element={<Employees />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={ALL} />}>
            <Route path="/settings" element={<Layout />}>
              <Route index element={<Settings />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <div className="p-10 text-center">
                <h1 className="text-2xl font-semibold">
                  We couldn’t find that page.
                </h1>
                <a className="text-primary" href="/">
                  Back to home
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
