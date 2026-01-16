import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) return <p>Loading...</p>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;