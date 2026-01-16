import Loading from "./Loading";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { loginUser } from "../redux/authSlice";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
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
            <input
              type="password"
              placeholder="Enter your password"
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
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