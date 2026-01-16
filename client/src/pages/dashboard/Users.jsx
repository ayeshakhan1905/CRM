import { useEffect, useState } from "react";
import Loading from "../Loading";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  addUser,
  updateUser,
  deleteUser,
} from "../../redux/userSlice";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiActivity,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

export default function Users() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const users = useSelector((state) => state.users.list);
  const error = useSelector((state) => state.users.error);
  const loading = useSelector((state) => state.users.loading);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
  });

  // ...existing code...

  // Fetch users only if logged-in user is admin
  useEffect(() => {
    if (user?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, user]);

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or Update user
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (isEditMode && editingUser) {
      dispatch(updateUser({ id: editingUser._id, updates: formData })).then(
        () => {
          resetForm();
        }
      );
    } else {
      dispatch(addUser(formData)).then(() => resetForm());
    }
  };

  // Edit User
  const handleEdit = (u) => {
    setIsEditMode(true);
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "", // password not shown for edit
      role: u.role,
    });
    setIsModalOpen(true);
  };

  // Delete User
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUser(id));
    }
  };

  // Reset Modal/Form
  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "sales" });
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  // Restrict non-admins
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-200/60 p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            Only administrators can view and manage user accounts. Please contact your administrator for access.
          </p>
          <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
            Admin privileges required
          </div>
        </div>
      </div>
    );
  }

  // Search Filter
  const filteredUsers = users?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role) => {
  return FiUser;
  };

  const getRoleBadge = (role) => {
    return role === "admin"
      ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
      : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200";
  };

  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter(u => u.role === "admin").length || 0;
  const salesUsers = users?.filter(u => u.role === "sales").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiUsers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="text-lg" />
            Add New User
          </button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Administrators</p>
                <p className="text-3xl font-bold text-gray-900">{adminUsers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiUser className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sales Team</p>
                <p className="text-3xl font-bold text-gray-900">{salesUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          )}
        </div>


        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-red-200/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiUserX className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Users</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced User Table */}
        {!loading && filteredUsers?.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {filteredUsers.map((u) => {
                    const RoleIcon = getRoleIcon(u.role);
                    return (
                      <tr key={u._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                              <div className="text-xs text-gray-500">
                                {u._id === user?._id && (
                                  <span className="inline-flex items-center gap-1 text-blue-600">
                                    <FiUserCheck className="text-xs" />
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiMail className="text-gray-400 text-sm" />
                            <span className="text-sm text-gray-900">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                            <RoleIcon className="text-sm" />
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                              title="Edit User"
                            >
                              <FiEdit2 className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                              title="Delete User"
                            >
                              <FiTrash2 className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
            <div className="text-gray-500">
              <FiUsers className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600 mb-6">
                {search ? "No users match your search criteria." : "Get started by adding your first user."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {isEditMode ? <FiEdit2 className="text-white text-lg" /> : <FiPlus className="text-white text-lg" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isEditMode ? "Edit User" : "Add New User"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {isEditMode ? "Update user information" : "Create a new user account"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  />
                </div>
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white"
                >
                  <option value="sales">Sales Representative</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.role === "admin" 
                    ? "Full system access and user management" 
                    : "Access to sales features and customer management"}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  {isEditMode ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}