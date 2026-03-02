import Loading from "./Loading";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { loginUser } from "../redux/authSlice";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-white px-4">
      {loading ? (
        <Loading />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 border border-gray-100"
        >
          {/* Branding */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-blue-700">CRM Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Login to continue</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-100 p-2 rounded-lg text-center">
              {error}
            </p>
          )}

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.219.215-2.388.607-3.485m1.508-1.508A9.973 9.973 0 0112 3c5.523 0 10 4.477 10 10 0 1.38-.283 2.694-.786 3.896M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-.705 2.42-2.05 4.572-3.794 6.07M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 shadow-md"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Back to Home */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition mt-2"
          >
            ← Back to Home
          </button>

          {/* Footer */}
          <p className="text-gray-400 text-xs text-center mt-6">
            © 2025 CRM Dashboard. All rights reserved.
          </p>
        </form>
      )}
    </div>
  );
}