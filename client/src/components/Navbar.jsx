import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, Package, Gavel, 
  ChevronDown, LogOut, User as UserIcon, 
  ShoppingBag, Plus, Heart, Menu, X 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-white border-b border-slate-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo Section */}
          <Link to={user ? "/market" : "/"} className="flex items-center gap-3 group">
            <div className="bg-slate-900 p-2 rounded-lg shadow-sm group-hover:bg-slate-800 transition-colors">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              BidCycle
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link to="/market" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                  Marketplace
                </Link>

                {user.role === 'Seller' && (
                  <Link to="/create-item" className="px-4 py-2 ml-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Sell Item
                  </Link>
                )}

                {user.role !== 'Admin' && (
                  <Link to="/dashboard" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'Buyer' && (
                  <Link to="/watchlist" className="p-2 ml-1 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-full transition-colors relative">
                    <Heart className="w-5 h-5" />
                  </Link>
                )}

                {/* Admin Dropdown */}
                {user.role === 'Admin' && (
                  <div className="relative group px-1">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none">
                      <span>Admin</span>
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                      <div className="px-4 py-1.5 mb-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Panel</span>
                      </div>
                      <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <LayoutDashboard className="w-4 h-4 mr-3" /> Overview
                      </Link>
                      <Link to="/admin/users" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <Users className="w-4 h-4 mr-3" /> Manage Users
                      </Link>
                      <Link to="/admin/items" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <Package className="w-4 h-4 mr-3" /> Manage Items
                      </Link>
                      <Link to="/admin/bids" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                        <Gavel className="w-4 h-4 mr-3" /> Manage Bids
                      </Link>
                    </div>
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="flex items-center pl-4 ml-2 border-l border-slate-200">
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-1 pr-2 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all focus:outline-none">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden border border-brand-100">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-brand-600 font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                        <span className="inline-block px-2 py-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-md">
                          {user.role}
                        </span>
                      </div>

                      <Link to={user.role === 'Admin' ? '/admin-account' : '/account'} className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        <UserIcon className="w-4 h-4 mr-3" /> Profile Settings
                      </Link>

                      <div className="border-t border-slate-50 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4 mr-3" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-95">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white border-b border-slate-200 shadow-xl pb-6 px-4 pt-2">
          {/* Mobile menu content logic goes here. Keeping it brief for structural brevity */}
           {user ? (
            <div className="space-y-1">
               <div className="p-3 mb-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100">
                    <span className="text-brand-600 font-bold">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
               </div>
               <Link to="/market" className="block px-3 py-2 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Marketplace</Link>
               <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Dashboard</Link>
               <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-lg text-red-600 font-semibold hover:bg-red-50 mt-4">Sign Out</button>
            </div>
           ) : (
            <div className="space-y-2 mt-2">
              <Link to="/login" className="block w-full text-center px-4 py-3 bg-slate-50 text-slate-700 font-bold rounded-lg">Sign In</Link>
              <Link to="/register" className="block w-full text-center px-4 py-3 bg-slate-900 text-white font-bold rounded-lg shadow-sm">Get Started</Link>
            </div>
           )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;