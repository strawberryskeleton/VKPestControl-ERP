import { useAuth } from "../contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && roles.length && user.role !== "super_admin" && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};
