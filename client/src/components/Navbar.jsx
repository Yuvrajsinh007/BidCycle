import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Gavel, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  ShoppingBag,
  PlusCircle,
  List
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Decreased py-4 to py-2 for smaller height */}
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to={user ? "/market" : "/"} className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              BidCycle
            </span>
          </Link>

          {/* Navigation Links */}
          {user ? (
            <>
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  to="/market"
                  className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Marketplace
                </Link>

                {/* Seller Links */}
                {user.role === 'Seller' && (
                  <>
                    <Link
                      to="/create-item"
                      className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Sell Item
                    </Link>
                  </>
                )}

                {/* Buyer/Seller Dashboard (Non-Admin) */}
                {user.role !== 'Admin' && (
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Dashboard
                  </Link>
                )}

                {/* --- Admin Dropdown --- */}
                {user.role === 'Admin' && (
                  <div className="relative group px-2">
                    <button className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium rounded-lg hover:bg-gray-50 transition-all focus:outline-none">
                      <span>Admin Panel</span>
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 transform origin-top-center scale-95 group-hover:scale-100">
                      
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</span>
                      </div>

                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard Overview
                      </Link>
                      
                      <Link
                        to="/admin/users"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                      >
                        <Users className="w-4 h-4 mr-3" />
                        Manage Users
                      </Link>

                      <Link
                        to="/admin/items"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                      >
                        <Package className="w-4 h-4 mr-3" />
                        Manage Items
                      </Link>

                      <Link
                        to="/admin/bids"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                      >
                        <Gavel className="w-4 h-4 mr-3" />
                        Manage Bids
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info & Profile Dropdown */}
              <div className="flex items-center space-x-4 pl-4">
                <div className="relative group">
                  <button className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors">
                    {/* Decreased size from w-10 h-10 to w-9 h-9 */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-[2px]">
                       <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {user.profilePic ? (
                            <img 
                              src={user.profilePic} 
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-indigo-600 font-bold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                       </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 transform origin-top-right scale-95 group-hover:scale-100">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mt-2">
                        {user.role} Account
                      </span>
                    </div>

                    <div className="py-2">
                      <Link
                        to={user.role === 'Admin' ? '/admin-account' : '/account'}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                      >
                        <UserIcon className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Link>

                      {user.role === 'Seller' && (
                         <Link
                         to="/my-items"
                         className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                       >
                         <List className="w-4 h-4 mr-3" />
                         My Listings
                       </Link>
                      )}

                      {user.role !== 'Admin' && user.role !== 'Seller' && (
                         <Link
                         to="/dashboard"
                         className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors mx-2 rounded-md"
                       >
                         <ShoppingBag className="w-4 h-4 mr-3" />
                         My Bids & Orders
                       </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mx-2 rounded-md"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="hidden sm:block px-5 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                // Decreased vertical padding to py-2 to match navbar height
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;