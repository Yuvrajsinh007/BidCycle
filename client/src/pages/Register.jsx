import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Phone, MapPin, FileText, Gavel, AlertCircle } from "lucide-react";

const InputField = ({ label, icon: Icon, type = "text", ...rest }) => (
  <div>
    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      )}
      <input
        type={type}
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all`}
        {...rest}
      />
    </div>
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "",
    bio: "", password: "", confirmPassword: "", role: "Buyer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match.");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters long.");

    setLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      if (result.success) {
        if (result.requiresVerification) {
          navigate("/verify-otp", { state: { email: result.email, type: 'registration' } });
        } else {
          navigate("/market");
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-slate-50">
       
       {/* LEFT: Branding/Image — Sticky on desktop */}
       <div className="hidden lg:flex lg:w-1/2 relative bg-black lg:h-screen lg:sticky lg:top-0 overflow-hidden shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1550537687-c913840e89ae?q=80&w=2071&auto=format&fit=crop" 
          alt="Architecture" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
        
        {/* Added padding top to avoid hiding under the Navbar */}
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 h-full text-white w-full pt-28 lg:pt-32 pb-12">
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <Gavel className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">BidCycle</span>
          </Link>

          <div className="mb-10">
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight drop-shadow-lg">
              Join the <br /> elite network.
            </h1>
            <p className="text-lg text-slate-300 max-w-md font-medium drop-shadow-md">
              Create your account today to access global verified auctions or list your own premium assets.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Form — Naturally scrollable */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12 pt-20 lg:pt-28 pb-12 min-h-screen bg-slate-50">
        
        {/* Removed fixed height margins so standard layout dictates size smoothly */}
        <div className="w-full max-w-lg m-auto bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 animate-fadeIn relative z-10">
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Join BidCycle to start bidding or selling.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField label="Full Name" icon={User} name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Email Address" icon={Mail} type="email" name="email" placeholder="name@company.com" value={formData.email} onChange={handleChange} required />
              <InputField label="Phone Number" icon={Phone} type="tel" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <InputField label="Address" icon={MapPin} name="address" placeholder="123 Main St, NY" value={formData.address} onChange={handleChange} required />
               <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Type</label>
                  <select
                    name="role" value={formData.role} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
               </div>
            </div>

            <div>
               <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Short Bio</label>
               <div className="relative">
                  <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none"><FileText className="h-5 w-5 text-slate-400" /></div>
                  <textarea
                    name="bio" value={formData.bio} onChange={handleChange} rows="2"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none"
                    placeholder="Tell us a bit about what you collect or sell..."
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                 <InputField label="Password" icon={Lock} type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bottom-3 right-4 text-slate-400 hover:text-slate-600 focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 </button>
              </div>
              <div className="relative">
                 <InputField label="Confirm Password" icon={Lock} type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute bottom-3 right-4 text-slate-400 hover:text-slate-600 focus:outline-none">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                 </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <span className="animate-pulse">Creating Account...</span> : <>Create Account <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-slate-900 hover:text-teal-500 transition-colors">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;