import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { token, otp } = location.state || {};

  if (!token || !otp) {
    setTimeout(() => navigate("/forgot-password"), 0);
    return null;
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters long");

    setLoading(true);
    try {
      const result = await resetPassword(token, otp, formData.password);
      if (result.success) setSuccess(true);
      else setError(result.message);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 sm:p-12 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-100">
            <CheckCircle2 className="w-10 h-10 text-brand-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Password Reset!</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Your credentials have been securely updated. You can now access your account.
          </p>
          <Link
            to="/login"
            className="w-full flex items-center justify-center py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Sign In with New Password <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT: Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2070" 
          alt="Secure Data" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
              Create New <br /> Password
            </h1>
            <p className="text-lg text-slate-400 max-w-sm font-medium">
              Choose a strong, unique password to maintain your top-tier security.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fadeIn relative z-10">
          
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Setup Password</h2>
            <p className="text-slate-500 font-medium">Please enter your new strong password.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <span className="animate-pulse">Updating...</span> : <>Save Password <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;