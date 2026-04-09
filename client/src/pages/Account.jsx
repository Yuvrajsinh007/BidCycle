import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  User, Lock, Camera, Trash2, Mail, Phone, MapPin, 
  FileText, AlertTriangle, CheckCircle, X, Shield, 
  Upload, Save, LogOut, Eye, EyeOff
} from 'lucide-react';

const TabWrapper = ({ children }) => (
  <div className="space-y-8 animate-fadeIn">{children}</div>
);

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL.split('/api')[0];
    return `${baseUrl}/${path.replace(/\\/g, '/')}`;
  };

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({ name: "", email: "", phone: "", address: "", bio: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [deleteData, setDeleteData] = useState({ password: "", confirmText: "" });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "", email: user.email || "", phone: user.phone || "",
        address: user.address || "", bio: user.bio || "",
      });
      setProfilePicPreview(user.profilePic);
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setLoading(true); setMessage({ type: "", text: "" });
    try {
      const { data } = await api.put("/auth/profile", profileData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Update failed" }); } 
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setMessage({ type: "", text: "" });
    if (passwordData.newPassword !== passwordData.confirmPassword) return setMessage({ type: "error", text: "Passwords do not match" });
    if (passwordData.newPassword.length < 6) return setMessage({ type: "error", text: "Password too short" });

    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Password change failed" }); } 
    finally { setLoading(false); }
  };

  const handleProfilePicUpload = async (e) => {
    e.preventDefault();
    if (!profilePic) return setMessage({ type: "error", text: "Select an image first" });
    setLoading(true); setMessage({ type: "", text: "" });

    try {
      const formData = new FormData(); formData.append("profilePic", profilePic);
      const { data } = await api.post('/auth/profile-pic', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: "success", text: "Profile picture updated!" });
      setProfilePicPreview(data.profilePic); setProfilePic(null);
      localStorage.setItem("user", JSON.stringify({ ...user, profilePic: data.profilePic }));
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Upload failed" }); } 
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteData.confirmText !== "DELETE") return setMessage({ type: "error", text: "Type DELETE to confirm" });

    setLoading(true);
    try {
      await api.delete("/auth/account", { data: { password: deleteData.password } });
      setMessage({ type: "success", text: "Account deleted." });
      setTimeout(() => { logout(); navigate("/"); }, 2000);
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Deletion failed" }); } 
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(e.target.files[0]);
      const reader = new FileReader(); reader.onloadend = () => setProfilePicPreview(reader.result); reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!user) return <div className="h-screen flex justify-center items-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  const tabs = [
    { id: "profile", icon: <User className="w-5 h-5" />, label: "Public Profile" },
    { id: "password", icon: <Lock className="w-5 h-5" />, label: "Security & Password" },
    { id: "profile-pic", icon: <Camera className="w-5 h-5" />, label: "Account Avatar" },
    { id: "delete", icon: <Trash2 className="w-5 h-5" />, label: "Danger Zone", danger: true },
  ];

  return (
    // FIX 1: Adjusted padding classes for responsive top spacing
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 pb-12 pt-24 md:pt-36 lg:pt-40">
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm md:text-base">Manage your global identity and security preferences.</p>
        </div>

        {message.text && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between shadow-sm animate-fadeIn ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            <div className="flex items-center gap-3 font-bold">
                {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {message.text}
            </div>
            <button onClick={() => setMessage({ type: "", text: "" })} className="p-1 hover:bg-white/50 rounded-full transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* FIX 2: Added items-start to the grid container */}
        <div className="grid md:grid-cols-[280px_1fr] md:gap-8 gap-y-8 items-start">
          
          {/* SIDEBAR */}
          {/* FIX 3: Changed to md:sticky and md:top-36 */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden h-fit md:sticky md:top-36 z-10">
            <div className="p-6 md:p-8 bg-slate-900 text-white text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-500 opacity-20 mix-blend-overlay"></div>
              <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 overflow-hidden mx-auto mb-4 shadow-2xl bg-slate-800 flex items-center justify-center">
                {profilePicPreview || user.profilePic ? (
                  <img src={getFileUrl(profilePicPreview || user.profilePic)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-slate-500">{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h3 className="font-black text-xl truncate relative z-10">{user.name}</h3>
              <p className="text-slate-400 font-medium text-sm truncate relative z-10">{user.email}</p>
            </div>

            <nav className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMessage({ type: "", text: "" }); }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all font-bold text-sm ${
                    activeTab === tab.id
                      ? tab.danger ? "bg-red-50 text-red-600 shadow-sm" : "bg-slate-50 text-slate-900 shadow-sm border border-slate-100"
                      : tab.danger ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={activeTab === tab.id ? (tab.danger ? "text-red-500" : "text-brand-600") : tab.danger ? "text-red-400" : "text-slate-400"}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENT */}
          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-5 sm:p-8 md:p-12 min-h-[500px]">
            
            {activeTab === "profile" && (
              <TabWrapper>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-50 rounded-xl"><User className="w-6 h-6 text-brand-600" /></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Personal Information</h2>
                        <p className="text-slate-500 font-medium text-sm">Visible to other users on your profile</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {[
                      { l: "Full Name", ico: User, val: profileData.name, k: "name", t: "text" },
                      { l: "Email Address", ico: Mail, val: profileData.email, k: "email", t: "email", dis: true },
                      { l: "Phone Number", ico: Phone, val: profileData.phone, k: "phone", t: "tel" },
                      { l: "Physical Address", ico: MapPin, val: profileData.address, k: "address", t: "text" },
                    ].map(f => (
                      <div key={f.k}>
                         <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 ml-1">{f.l}</label>
                         <div className="relative">
                            <f.ico className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type={f.t} value={f.val} onChange={e => !f.dis && setProfileData({...profileData, [f.k]: e.target.value})} disabled={f.dis} className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl font-bold transition-all outline-none ${f.dis ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-brand-500'}`} />
                         </div>
                      </div>
                    ))}
                  </div>

                  <div>
                     <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 ml-1">Biography</label>
                     <div className="relative">
                        <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                        <textarea rows="4" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} placeholder="Tell the community about yourself..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-brand-500 transition-all outline-none resize-none" />
                     </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-black tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2">
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </TabWrapper>
            )}

            {activeTab === "password" && (
              <TabWrapper>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-900 rounded-xl"><Shield className="w-6 h-6 text-white" /></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Security</h2>
                        <p className="text-slate-500 font-medium text-sm">Update your secure encryption keys</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                   {[
                      { l: "Current Password", v: passwordData.currentPassword, k: "currentPassword", s: showCurrentPassword, ss: setShowCurrentPassword },
                      { l: "New Password", v: passwordData.newPassword, k: "newPassword", s: showNewPassword, ss: setShowNewPassword },
                      { l: "Confirm New Password", v: passwordData.confirmPassword, k: "confirmPassword", s: showConfirmPassword, ss: setShowConfirmPassword }
                   ].map(f => (
                     <div key={f.k}>
                        <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 ml-1">{f.l}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                          <input type={f.s ? "text" : "password"} required value={f.v} onChange={e => setPasswordData({...passwordData, [f.k]: e.target.value})} className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-brand-500 transition-all outline-none" />
                          <button type="button" onClick={() => f.ss(!f.s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none">{f.s ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                        </div>
                     </div>
                   ))}

                  <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full px-8 py-4 bg-slate-900 text-white rounded-xl font-black tracking-wide hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </TabWrapper>
            )}

            {activeTab === "profile-pic" && (
              <TabWrapper>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-50 rounded-xl"><Camera className="w-6 h-6 text-brand-600" /></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Avatar</h2>
                        <p className="text-slate-500 font-medium text-sm">Personalize your bidding presence</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50">
                  <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl mb-10 border-4 border-white bg-slate-200 flex items-center justify-center text-slate-400">
                    {profilePicPreview ? <img src={getFileUrl(profilePicPreview)} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-20 h-20" />}
                  </div>
                  
                  <div className="w-full max-w-sm space-y-4">
                    <label className="block w-full cursor-pointer hover:scale-105 transition-transform">
                       <div className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 font-bold text-brand-600 text-sm">
                            <Upload className="w-5 h-5" /> Choose Image File
                       </div>
                       <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button onClick={handleProfilePicUpload} disabled={loading || !profilePic} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 font-black text-sm active:scale-95">
                      {loading ? "Uploading..." : "Save New Avatar"}
                    </button>
                  </div>
                </div>
              </TabWrapper>
            )}

            {activeTab === "delete" && (
              <TabWrapper>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Danger Zone</h2>
                        <p className="text-slate-500 font-medium text-sm">Destructive actions reside here.</p>
                    </div>
                </div>

                <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                  <h3 className="font-black text-red-800 text-xl mb-3 flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> Irreversible Action</h3>
                  <p className="text-red-700 mb-8 font-medium leading-relaxed max-w-2xl">
                    Deleting your account implies permanent eviction from BidCycle. All identity graphs, active listings, bid trails, and stored crypts will be wiped.
                  </p>
                  
                  <form onSubmit={handleDeleteAccount} className="space-y-6 max-w-md bg-white p-8 rounded-2xl border border-red-100 shadow-xl shadow-red-100/50">
                    <div>
                      <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 ml-1">Confirm with Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input type={showDeletePassword ? "text" : "password"} required value={deleteData.password} onChange={e => setDeleteData({ ...deleteData, password: e.target.value })} className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:border-red-500 outline-none transition-all" />
                        <button type="button" onClick={() => setShowDeletePassword(!showDeletePassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2 ml-1">Type "DELETE"</label>
                      <input type="text" required placeholder="DELETE" value={deleteData.confirmText} onChange={e => setDeleteData({ ...deleteData, confirmText: e.target.value })} className="w-full px-4 py-3.5 text-center tracking-widest bg-slate-50 border-2 border-slate-100 rounded-xl font-black focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div className="pt-4">
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-black shadow-lg shadow-red-200 active:scale-95 disabled:opacity-70">
                        {loading ? "Wiping Data..." : <><Trash2 className="w-5 h-5" /> Erase Account</>}
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