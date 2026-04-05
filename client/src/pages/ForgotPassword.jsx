import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, ArrowLeft, KeyRound, AlertCircle, ArrowRight } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        navigate("/verify-otp", { state: { email, token: result.token } });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      
      {/* LEFT: Branding/Image — fixed, fills viewport */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden flex-shrink-0">
        <img 
          src="https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80&w=2070" 
          alt="Security Vault" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
              Account <br /> Recovery
            </h1>
            <p className="text-lg text-slate-400 max-w-sm font-medium">
              We'll get you back to bidding and selling securely in just a few steps.
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
              <KeyRound className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Forgot Password?</h2>
            <p className="text-slate-500 font-medium">Enter your email and we'll send a secure code.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-pulse">Sending...</span> : <>Send Code <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>
          </div>
          
        </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;