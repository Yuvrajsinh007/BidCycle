import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import axios from "axios";
import {
  User,
  Lock,
  Camera,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Shield,
  Upload,
  Save,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

// Component defined outside to prevent refreshing
const TabWrapper = ({ children }) => (
  <div className="space-y-6 animate-fadeIn">{children}</div>
);

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deleteData, setDeleteData] = useState({
    password: "",
    confirmText: "",
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      });
      setProfilePicPreview(user.profilePic);
    }
  }, [user]);

  // --- Handlers ---

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/auth/profile", profileData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    e.preventDefault();
    if (!profilePic) {
      setMessage({ type: "error", text: "Please select an image first" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("profilePic", profilePic);

    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_URL;
      
      const response = await axios.post(`${baseURL}/auth/profile-pic`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setMessage({ type: "success", text: "Profile picture updated!" });
      setProfilePicPreview(response.data.profilePic);
      setProfilePic(null);
      
      const updatedUser = { ...user, profilePic: response.data.profilePic };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload profile picture",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteData.confirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    setLoading(true);
    try {
      await api.delete("/auth/account", {
        data: { password: deleteData.password }, 
      });

      setMessage({ type: "success", text: "Account deleted. Goodbye!" });
      setTimeout(() => {
        logout();
        navigate("/");
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", icon: <User className="w-5 h-5" />, label: "Profile Info" },
    { id: "password", icon: <Lock className="w-5 h-5" />, label: "Security" },
    { id: "profile-pic", icon: <Camera className="w-5 h-5" />, label: "Profile Picture" },
    { id: "delete", icon: <Trash2 className="w-5 h-5" />, label: "Delete Account", danger: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-gray-500 mt-2">Manage your personal information and preferences</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm animate-fadeIn ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
                {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="font-medium">{message.text}</span>
            </div>
            <button 
                onClick={() => setMessage({ type: "", text: "" })} 
                className="p-1 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit sticky top-24">
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden mx-auto mb-4 shadow-lg bg-white">
                {profilePicPreview || user.profilePic ? (
                  <img
                    src={profilePicPreview || user.profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 text-3xl font-bold bg-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg truncate">{user.name}</h3>
              <p className="text-indigo-100 text-sm truncate opacity-90">{user.email}</p>
            </div>

            <nav className="p-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage({ type: "", text: "" });
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm mb-1 ${
                    activeTab === tab.id
                      ? tab.danger 
                        ? "bg-red-50 text-red-600 shadow-sm"
                        : "bg-indigo-50 text-indigo-600 shadow-sm"
                      : tab.danger
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={`${
                    activeTab === tab.id 
                        ? "text-current" 
                        : tab.danger ? "text-red-400" : "text-gray-400"
                  }`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <TabWrapper>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                        <p className="text-gray-500 text-sm">Update your public profile details</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <textarea
                        rows="4"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                        placeholder="Tell us a bit about yourself..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed font-medium transform active:scale-95"
                    >
                      {loading ? (
                          <>Saving...</>
                      ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                      )}
                    </button>
                  </div>
                </form>
              </TabWrapper>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <TabWrapper>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                        <p className="text-gray-500 text-sm">Update your security credentials</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  {/* Current Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength="6"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed font-medium transform active:scale-95"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </TabWrapper>
            )}

            {/* Profile Picture Tab */}
            {activeTab === "profile-pic" && (
              <TabWrapper>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Profile Picture</h2>
                        <p className="text-gray-500 text-sm">Update your public avatar</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/30">
                  <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl mb-8 border-4 border-white ring-4 ring-indigo-50">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                         <User className="w-20 h-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full max-w-sm space-y-4">
                    <label className="block w-full cursor-pointer group">
                       <div className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl shadow-sm text-gray-600 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-all">
                            <Upload className="w-4 h-4" />
                            <span className="font-medium text-sm">Choose Image File</span>
                       </div>
                       <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                    <button
                      onClick={handleProfilePicUpload}
                      disabled={loading || !profilePic}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform active:scale-[0.98]"
                    >
                      {loading ? "Uploading..." : "Upload New Picture"}
                    </button>
                    <p className="text-xs text-center text-gray-400">Supported formats: JPG, PNG, JPEG</p>
                  </div>
                </div>
              </TabWrapper>
            )}

            {/* Delete Account Tab */}
            {activeTab === "delete" && (
              <TabWrapper>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-8">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
                        <p className="text-gray-500 text-sm">Permanently remove your account and data</p>
                    </div>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5" /> Warning: This action is irreversible
                  </h3>
                  <p className="text-red-700 mb-6 text-sm leading-relaxed">
                    Deleting your account will permanently remove all your personal data, active bids, and listed items. This action cannot be undone. Please be certain before proceeding.
                  </p>
                  
                  <form onSubmit={handleDeleteAccount} className="space-y-5 max-w-md bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                    {/* Delete Account Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter Password to Confirm</label>
                      <div className="relative">
                        <input
                          type={showDeletePassword ? "text" : "password"}
                          required
                          value={deleteData.password}
                          onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                          className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                          placeholder="Your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                        >
                          {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type "DELETE"</label>
                      <input
                        type="text"
                        required
                        placeholder="DELETE"
                        value={deleteData.confirmText}
                        onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 hover:shadow-red-300 disabled:opacity-50 font-medium transform active:scale-[0.98]"
                      >
                        {loading ? (
                             "Deleting..." 
                        ) : (
                             <><Trash2 className="w-5 h-5" /> Permanently Delete Account</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </TabWrapper>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;