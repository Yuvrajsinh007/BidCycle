import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { email, token } = location.state || {};

  // Redirect if no state present (accessed directly)
  if (!email || !token) {
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    // Navigate to Reset Password with Token AND OTP
    navigate("/reset-password", { state: { token, otp, email } });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 opacity-90 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1614064641938-3bcee529cfc4?auto=format&fit=crop&q=80&w=2000" 
          alt="Security Lock" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center px-12">
          <h2 className="text-4xl font-bold text-white mb-6">Two-Factor Security</h2>
          <p className="text-indigo-100 text-lg max-w-md mx-auto">
            We use one-time passwords to ensure only you can access your account changes.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Enter Code</h2>
            <p className="text-gray-500 text-sm">
              We've sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                One-Time Password
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-[0.98]"
            >
              Verify & Continue <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Use a different email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;