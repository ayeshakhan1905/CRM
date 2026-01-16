// src/pages/Dashboard.jsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiBarChart,
  FiLogOut,
  FiUserCheck,
  FiBriefcase,
  FiTrendingUp,
  FiClipboard,
  FiBook,
  FiLayers,
  FiUser,
  FiMenu,
  FiX,
  FiMail,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/authSlice";
import Notifications from "../../components/Notifications";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const navigationItems = [
    { to: "", icon: FiHome, label: "Dashboard", end: true },
    ...(user?.role === "admin" ? [{ to: "users", icon: FiUsers, label: "Users" }] : []),
    { to: "tasks", icon: FiFileText, label: "Tasks" },
    { to: "reports", icon: FiBarChart, label: "Analytics" },
    { to: "customers", icon: FiUserCheck, label: "Customers" },
    { to: "deals", icon: FiBriefcase, label: "Deals" },
    { to: "leads", icon: FiTrendingUp, label: "Leads" },
    { to: "logs", icon: FiClipboard, label: "Activity Logs" },
    { to: "notes", icon: FiBook, label: "Notes" },
    { to: "email-templates", icon: FiMail, label: "Email Templates" },
    { to: "stages", icon: FiLayers, label: "Deal Stages" },
    { to: "profile", icon: FiUser, label: "Profile" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-200 flex flex-col shadow-2xl border-r border-slate-700/50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-72" : "w-20"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header Section */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-8 px-6 pt-6">
            <div className={`flex items-center gap-3 ${sidebarOpen ? "block" : "hidden"}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  CRM Pro
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Customer Relations</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              {sidebarOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
          </div>

          {/* User Info Card */}
          {sidebarOpen && user && (
            <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user.name || 'User'}</p>
                  <p className="text-slate-400 text-xs capitalize">{user.role || 'Member'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className={`px-3 pb-2 ${sidebarOpen ? "block" : "hidden"}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          
          <nav className="space-y-1 pb-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to || 'dashboard'}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 mx-1 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white shadow-lg border border-blue-400/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/40"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
                    )}
                    <item.icon 
                      className={`text-lg flex-shrink-0 transition-all duration-200 ${
                        isActive ? "text-blue-400" : "group-hover:text-blue-300"
                      }`} 
                    />
                    <span 
                      className={`font-medium transition-all duration-200 ${
                        sidebarOpen ? "block" : "hidden"
                      } ${isActive ? "text-white" : ""}`}
                    >
                      {item.label}
                    </span>
                    {isActive && sidebarOpen && (
                      <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 hover:from-red-500 hover:to-red-600 hover:text-white transition-all duration-200 border border-red-500/20 hover:border-red-400"
          >
            <FiLogOut className="text-lg group-hover:rotate-180 transition-transform duration-300" />
            <span className={`font-medium ${sidebarOpen ? "block" : "hidden"}`}>
              Sign Out
            </span>
          </button>
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-end">
            <Notifications />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <FiMenu className="text-xl" />
            </button>
            <div className="flex items-center gap-4">
              <Notifications />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="font-bold text-slate-800">CRM Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Styling */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}