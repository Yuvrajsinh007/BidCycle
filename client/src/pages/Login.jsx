import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Gavel, AlertCircle } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate("/market");
      } else if (result.requiresVerification) {
        navigate("/verify-otp", { state: { email: result.email, type: 'registration' } });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-slate-50">
      
      {/* LEFT: Branding/Image — Sticky on desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black lg:h-screen lg:sticky lg:top-0 overflow-hidden shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1529154691717-3306083d86e5?q=80&w=2070&auto=format&fit=crop" 
          alt="Abstract Architecture" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        
        {/* Added padding top to avoid hiding under the Navbar */}
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 h-full text-white w-full pt-28 lg:pt-32 pb-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Gavel className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">BidCycle</span>
          </Link>

          <div className="mb-10">
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight drop-shadow-lg">
              Unlock the <br /> extraordinary.
            </h1>
            <p className="text-lg text-slate-300 max-w-md font-medium drop-shadow-md">
              Access the premier global marketplace for verified auctions. Your next great find awaits.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth Form — Naturally scrollable */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12 pt-20 lg:pt-28 pb-12 min-h-screen bg-slate-50">
        
        {/* m-auto ensures it centers vertically if there's room, but pushes down gracefully if not */}
        <div className="w-full max-w-md m-auto bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fadeIn relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
             <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
             <p className="text-slate-500 font-medium">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <Link to="/forgot-password" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <span className="animate-pulse">Signing in...</span> : <>Sign In <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-slate-900 hover:text-teal-500 transition-colors">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default Login;