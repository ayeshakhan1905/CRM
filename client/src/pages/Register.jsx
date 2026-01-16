import Loading from "./Loading";
// import { useDispatch, useSelector } from "react-redux";
// import { useEffect, useState } from "react";
// import { registerUser } from "../redux/authSlice";
// import { useLocation, useNavigate, Link } from "react-router-dom";

// export default function Register() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "user"
//   });

//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

//   const location = useLocation();
//   const from = location.state?.from?.pathname || "/dashboard";

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate(from, { replace: true });
//     }
//   }, [isAuthenticated, navigate, from]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     dispatch(registerUser(form));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-white px-4">
//       <form
//         className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 border border-gray-100"
//         onSubmit={handleSubmit}
//       >
//         {/* Branding */}
//         <div className="text-center mb-6">
	const { error, isAuthenticated } = useSelector((state) => state.auth);
	const loading = false; // Replace with actual loading state if available
	if (loading) return <Loading />;
//             CRM Dashboard
//           </h1>
//           <p className="text-gray-500 text-sm mt-1">
//             Create your account to get started
//           </p>
//         </div>

//         {/* Error */}
//         {error && (
//           <p className="text-red-600 text-sm font-medium bg-red-100 p-2 rounded-lg text-center">
//             {error}
//           </p>
//         )}

//         {/* Name */}
//         <div className="flex flex-col gap-2">
//           <label className="font-medium text-gray-700">Name</label>
//           <input
//             type="text"
//             placeholder="Enter your name"
//             className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//             required
//           />
//         </div>

//         {/* Email */}
//         <div className="flex flex-col gap-2">
//           <label className="font-medium text-gray-700">Email</label>
//           <input
//             type="email"
//             placeholder="Enter your email"
//             className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
//             value={form.email}
//             onChange={(e) => setForm({ ...form, email: e.target.value })}
//             required
//           />
//         </div>

//         {/* Password */}
//         <div className="flex flex-col gap-2">
//           <label className="font-medium text-gray-700">Password</label>
//           <input
//             type="password"
//             placeholder="Enter your password"
//             className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
//             value={form.password}
//             onChange={(e) => setForm({ ...form, password: e.target.value })}
//             required
//           />
//         </div>

//         {/* Role */}
//         <div className="flex flex-col gap-2">
//           <label className="font-medium text-gray-700">Role</label>
//           <select
//             value={form.role}
//             onChange={(e) => setForm({ ...form, role: e.target.value })}
//             className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
//           >
//             <option value="user">User</option>
//             <option value="admin">Admin</option>
//           </select>
//         </div>

//         {/* Register Button */}
//         <button
//           type="submit"
//           disabled={loading}
//           className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-300 shadow-md"
//         >
//           {loading ? "Creating account..." : "Register"}
//         </button>

//         {/* Already have account */}
//         <p className="text-center text-sm text-gray-600">
//           Already have an account?{" "}
//           <Link
//             to="/login"
//             className="text-green-600 font-medium hover:text-green-800 transition"
//           >
//             Login here
//           </Link>
//         </p>

//         {/* Back to Home */}
//         <button
//           type="button"
//           onClick={() => navigate("/")}
//           className="text-green-600 hover:text-green-800 text-sm font-medium transition mt-2"
//         >
//           ← Back to Home
//         </button>

//         {/* Footer */}
//         <p className="text-gray-400 text-xs text-center mt-6">
//           © 2025 CRM Dashboard. All rights reserved.
//         </p>
//       </form>
//     </div>
//   );
// }