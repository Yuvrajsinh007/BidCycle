import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationOtp, verifyResetOtp } = useAuth();
  const { email, token, type } = location.state || {};

  // If there's no email state, kick them back to login
  if (!email) {
    navigate("/login");
    return null;
  }

  // If it's a password reset flow, ensure token exists
  if (type !== 'registration' && !token) {
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) return setError("Please enter a valid 6-digit secure code.");

    if (type === 'registration') {
      setLoading(true);
      const result = await verifyEmail(email, otp);
      if (result.success) {
        navigate("/market");
      } else {
        setError(result.message);
      }
      setLoading(false);
    } else {
      setLoading(true);
      const result = await verifyResetOtp(token, otp);
      if (result.success) {
        navigate("/reset-password", { state: { token, otp, email } });
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);
    const result = await resendVerificationOtp(email);
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setResendLoading(false);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT: Branding/Image — fixed, fills viewport */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden flex-shrink-0">
        <img 
          src="https://images.unsplash.com/photo-1614064641938-3bcee529cfc4?auto=format&fit=crop&q=80&w=2000" 
          alt="Security Lock" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
              Two-Factor <br /> Security
            </h1>
            <p className="text-lg text-slate-400 max-w-sm font-medium">
              We encrypt and verify every sensitive action on BidCycle infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Form — scrollable independently */}
      <div className="w-full lg:w-1/2 overflow-y-auto bg-slate-50">
        <div className="flex items-center justify-center min-h-full p-6 sm:p-12 pt-24">
          <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fadeIn relative z-10">
          
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-100">
              <ShieldCheck className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Verify Identity</h2>
            <p className="text-slate-500 font-medium text-sm">
              We've sent a 6-digit code to <br/> <strong className="text-slate-900 border-b border-slate-200">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
               <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                Secure Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full px-4 py-4 text-center text-4xl tracking-[0.5em] font-mono font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-brand-500 focus:bg-white transition-all shadow-sm outline-none placeholder-slate-300"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-pulse">Verifying...</span> : <>Verify Code <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>

          {type === 'registration' && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending new code..." : "Didn't receive the code? Resend OTP"}
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to={type === 'registration' ? "/login" : "/forgot-password"}
              className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> 
              Use a different email
            </Link>
          </div>
          
        </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;