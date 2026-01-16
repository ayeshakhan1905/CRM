import React, { useState, useEffect, useRef } from "react";
import Loading from "../Loading";
import { useDispatch, useSelector } from "react-redux";
import { updateUser, changePassword } from "../../redux/userSlice";
import { toast } from "react-toastify";
import axios from "../../api/axios";
import {
  FiUser,
  FiMail,
  FiLock,
  FiSave,
  FiKey,
  FiEye,
  FiEyeOff,
  FiShield,
  FiEdit2,
  FiCheck,
  FiCamera,
  FiSettings,
  FiUserCheck,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const loading = false; // Replace with actual loading state if available

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // Handle profile field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Profile update submit
  const handleSubmitProfile = async (e) => {
    e.preventDefault();

    try {
      await dispatch(updateUser({ id: user._id, updates: formData })).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err || "Update failed");
    }
  };

  // Password update submit
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      await dispatch(changePassword(passwordData)).unwrap();
      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err || "Password change failed");
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Profile picture upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post('/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfileImage(response.data.profileImage);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete profile picture
  const handleDeleteImage = async () => {
    if (!profileImage) return;

    try {
      await axios.delete('/users/profile-picture');
      setProfileImage(null);
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove image');
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getRoleIcon = (role) => {
  return role === "admin" ? FiShield : FiUserCheck;
  };

  const getRoleBadge = (role) => {
    return role === "admin"
      ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
      : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 mx-auto rounded-full object-cover shadow-xl border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {formData.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <button
                  onClick={triggerFileInput}
                  disabled={uploadingImage}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload new picture"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiCamera className="text-sm" />
                  )}
                </button>
                {profileImage && (
                  <button
                    onClick={handleDeleteImage}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                    title="Remove picture"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mt-4">
              {formData.name || "User Profile"}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(user?.role)}`}>
                {React.createElement(getRoleIcon(user?.role), { className: "text-sm" })}
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 mb-8">
            <div className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all duration-200 ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                }`}
              >
                <FiUser className="text-lg" />
                <span className="hidden sm:inline">Profile Information</span>
                <span className="sm:hidden">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all duration-200 ${
                  activeTab === "security"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                }`}
              >
                <FiShield className="text-lg" />
                <span className="hidden sm:inline">Security Settings</span>
                <span className="sm:hidden">Security</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-8">
            {activeTab === "profile" ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiUser className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                      <p className="text-gray-600 text-sm">Update your account details</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                    >
                      <FiEdit2 className="text-sm" />
                      Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg transition-all duration-200 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            : "bg-gray-50 cursor-not-allowed"
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg transition-all duration-200 ${
                          isEditing
                            ? "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            : "bg-gray-50 cursor-not-allowed"
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {React.createElement(getRoleIcon(user?.role), { className: "text-lg text-gray-600" })}
                          <span className="font-medium text-gray-900 capitalize">
                            {user?.role || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FiSettings className="text-lg text-gray-600" />
                          <span className="font-mono text-sm text-gray-700">
                            {user?._id?.slice(-8) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user?.name || "",
                            email: user?.email || "",
                          });
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
                      >
                        <FiSave className="text-lg" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FiShield className="text-red-600 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                    <p className="text-gray-600 text-sm">Update your password and security preferences</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all duration-200"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCheck className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• At least 6 characters long</li>
                      <li>• Must be different from current password</li>
                      <li>• Avoid using personal information</li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
                    >
                      <FiShield className="text-lg" />
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;