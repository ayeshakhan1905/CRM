import { Routes, Route, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchMe } from "./redux/authSlice";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoutes";
import Home from "./pages/Home";
import DashboardLayout from "./pages/dashboard/Dashboard";
import DashHome from "./pages/dashboard/DashHome";
import Users from "./pages/dashboard/Users";
import Tasks from "./pages/dashboard/Tasks";
import Reports from "./pages/dashboard/Reports";
import Customers from "./pages/dashboard/Customers";
import Deals from "./pages/dashboard/Deals";
import Leads from "./pages/dashboard/Leads";
import Logs from "./pages/dashboard/Logs";
import Notes from "./pages/dashboard/Notes";
import Stages from "./pages/dashboard/Stages";
import EmailTemplates from "./pages/dashboard/EmailTemplates";
import NotificationHistory from "./pages/dashboard/NotificationHistory";
import AdminRoute from "./components/AdminRoute";
import Profile from "./pages/dashboard/Profile";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socketService from './services/socketService';

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  // Socket connection management
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      socketService.connect(user._id);
    } else {
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  // 🔥 Auto redirect only if on login/register/home
  useEffect(() => {
    if (isAuthenticated) {
      if (
        location.pathname === "/login" ||
        location.pathname === "/register" ||
        location.pathname === "/"
      ) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.pathname]); 

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}
        <Route path="/" element={<Home />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* default index (when you only hit /dashboard) */}
          <Route index element={<DashHome />} />

          <Route path="home" element={<DashHome />} />
          <Route path="users" element={
            <AdminRoute>
              <Users/>
            </AdminRoute>
          } />
          <Route path="profile" element={<Profile/>}/>
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="customers" element={<Customers />} />
          <Route path="deals" element={<Deals />} />
          <Route path="leads" element={<Leads />} />
          <Route path="logs" element={<Logs />} />
          <Route path="notes" element={<Notes />} />
          <Route path="stages" element={<Stages />} />
          <Route path="email-templates" element={<EmailTemplates />} />
          <Route path="notifications" element={<NotificationHistory />} />
        </Route>
      </Routes>
    </>
  );
}
