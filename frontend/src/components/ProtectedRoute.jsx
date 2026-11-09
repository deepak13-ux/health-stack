import { Navigate, Outlet } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role))
    return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
