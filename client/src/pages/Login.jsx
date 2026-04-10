import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Gavel, AlertCircle, ShoppingBag, Store, CheckCircle, User as UserIcon } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

const RoleModal = ({ isOpen, profile, onSelect, loading }) => {
  const [selected, setSelected] = useState('Buyer');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp border border-slate-100">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <img 
                src={profile?.picture} 
                alt={profile?.name} 
                className="w-20 h-20 rounded-full border-4 border-white shadow-xl bg-slate-100"
              />
              <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full p-1.5 border-2 border-white">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">One last step!</h2>
            <p className="text-slate-500 font-medium italic">Welcome, {profile?.name.split(' ')[0]}</p>
            <p className="text-slate-500 font-medium mt-1">Please select how you want to use BidCycle</p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <button
              onClick={() => setSelected('Buyer')}
              className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all group ${
                selected === 'Buyer' 
                ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]' 
                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors ${
                selected === 'Buyer' ? 'bg-white/10' : 'bg-white'
              }`}>
                <ShoppingBag className={`w-6 h-6 ${selected === 'Buyer' ? 'text-white' : 'text-slate-900'}`} />
              </div>
              <span className="font-black tracking-tight text-lg mb-1">Buyer</span>
              <span className={`text-xs font-medium ${selected === 'Buyer' ? 'text-slate-300' : 'text-slate-400'}`}>I want to bid and buy items</span>
              {selected === 'Buyer' && <div className="absolute top-3 right-3"><CheckCircle className="w-5 h-5" /></div>}
            </button>

            <button
              onClick={() => setSelected('Seller')}
              className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all group ${
                selected === 'Seller' 
                ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]' 
                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-colors ${
                selected === 'Seller' ? 'bg-white/10' : 'bg-white'
              }`}>
                <Store className={`w-6 h-6 ${selected === 'Seller' ? 'text-white' : 'text-slate-900'}`} />
              </div>
              <span className="font-black tracking-tight text-lg mb-1">Seller</span>
              <span className={`text-xs font-medium ${selected === 'Seller' ? 'text-slate-300' : 'text-slate-400'}`}>I want to list and sell items</span>
              {selected === 'Seller' && <div className="absolute top-3 right-3"><CheckCircle className="w-5 h-5" /></div>}
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onSelect(selected)}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-pulse">Setting up your account...</span> : <>Confirm & Continue <ArrowRight className="w-5 h-5 ml-1" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google multi-step signup state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleInfo, setGoogleInfo] = useState({ credential: null, profile: null });

  const { login, googleLogin, googleSignup } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    const result = await googleLogin(credentialResponse.credential);
    
    if (result.success) {
      if (result.isNewUser) {
        // Stop and show role selection
        setGoogleInfo({ 
          credential: credentialResponse.credential, 
          profile: result.profile 
        });
        setShowRoleModal(true);
      } else {
        navigate("/market");
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleRoleSelection = async (role) => {
    setLoading(true);
    setError("");
    const result = await googleSignup(googleInfo.credential, role);
    if (result.success) {
      navigate("/market");
    } else {
      setError(result.message);
      setShowRoleModal(false);
    }
    setLoading(false);
  };

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
      
      <RoleModal 
        isOpen={showRoleModal} 
        profile={googleInfo.profile} 
        onSelect={handleRoleSelection} 
        loading={loading} 
      />
      
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

          <div className="mb-6">
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => setError("Google Sign In failed")}
               useOneTap
               theme="filled_black"
               shape="pill"
               width="100%"
            />
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-4 text-xs font-black text-slate-300 uppercase tracking-widest">or continue with email</span>
          </div>

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