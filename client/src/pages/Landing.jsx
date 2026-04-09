import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Shield, Zap, Globe, Trophy, PlayCircle } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="relative p-8 bg-slate-900 rounded-3xl border border-slate-800 hover:border-slate-700 transition-colors group">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
       <Icon className="w-32 h-32 text-white" />
    </div>
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 mb-6 group-hover:bg-brand-500/20 transition-colors">
        <Icon className="w-6 h-6 text-brand-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium text-sm md:text-base">{description}</p>
    </div>
  </div>
);

const Landing = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/market" replace />;

  return (
    <div className="min-h-screen bg-black overflow-hidden font-sans">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fadeIn">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-300 backdrop-blur-md mb-4">
             <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /> The Next Generation of Auctions
          </div>
          
          <h1 className="text-4xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Own the extraordinary, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-400">
               bid in real-time.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Discover rare collectibles, exclusive assets, and high-value items. BidCycle provides a secure, instantaneous infrastructure for premier auctions globally.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105"
            >
              Start Bidding <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/market"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5 text-slate-400" /> Browse Marketplace
            </Link>
          </div>
          
          <p className="text-sm font-semibold text-slate-600 pt-4">No credit card required to explore.</p>
        </div>
      </div>

      {/* Hero Image Showcase */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
         <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-brand-900/20 aspect-video md:aspect-[21/9] bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
              alt="Auction Experience" 
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
         </div>
      </div>

      {/* Features Grid */}
      <div className="bg-black relative z-10 py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center md:text-left mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Engineered for Action.</h2>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl font-medium">Why the world's top collectors and sellers trust BidCycle infrastructure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <FeatureCard 
                icon={Zap} 
                title="Sub-second Sync" 
                description="Built on WebSockets, every bid is broadcast globally in under 50ms ensuring perfect real-time accuracy."
             />
             <FeatureCard 
                icon={Shield} 
                title="Bank-grade Sec" 
                description="Encrypted data pipelines and verified seller logic means your assets and bids are perfectly secure."
             />
             <FeatureCard 
                icon={Globe} 
                title="Global Liquidity" 
                description="List once, sell globally. Tap into a worldwide network of vetted premium buyers instantly."
             />
             <FeatureCard 
                icon={Trophy} 
                title="Curated Quality" 
                description="Our marketplace enforces strict asset guidelines, maintaining a high-signal environment of rare finds."
             />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 py-32 bg-slate-900 border-t border-slate-800">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-8">Ready to find your next centerpiece?</h2>
            <Link
              to="/register"
              className="px-10 py-5 bg-brand-500 text-white font-black rounded-full hover:bg-brand-600 transition-all inline-block shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-brand-500/50 hover:scale-105"
            >
              Create Free Account
            </Link>
         </div>
      </div>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-white/5 relative z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-black" />
               </div>
               <span className="text-xl font-bold text-white tracking-tight">BidCycle</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} BidCycle Inc. Elevating the marketplace.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default Landing;