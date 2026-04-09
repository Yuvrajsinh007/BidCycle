import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, Package, Gavel, 
  ChevronDown, LogOut, User as UserIcon, 
  ShoppingBag, Plus, Heart, Menu, X, List, Bell
} from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL.split('/api')[0];
    return `${baseUrl}/${path.replace(/\\/g, '/')}`;
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Buyer') {
      fetchNotifications();
      // Poll every 5 seconds for new notifications to ensure live updates without page refresh
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (error) {
      console.error('Failed to mark notifications', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - (notifications.find(n => n._id === id)?.read ? 0 : 1)));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
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
                  <>
                    <Link to="/watchlist" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent">
                      <Heart className="w-4 h-4" /> Watchlist
                    </Link>
                    <Link to="/my-orders" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent">
                      <List className="w-4 h-4" /> My Orders
                    </Link>
                    <Link to="/cart" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent">
                      <ShoppingBag className="w-4 h-4" /> Cart
                    </Link>
                  </>
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

                {/* Notification Dropdown (Buyers Only) */}
                {user.role === 'Buyer' && (
                <div className="relative group ml-1 flex items-center">
                   <button 
                      className="relative p-2 text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
                      onMouseEnter={() => {
                        setShowNotifications(true);
                        if (unreadCount > 0) markAllAsRead();
                      }}
                   >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                      )}
                   </button>
                   
                    {showNotifications && (
                       <div 
                          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn"
                          onMouseLeave={() => setShowNotifications(false)}
                       >
                          <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-900">Notifications</span>
                              <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                  <button onClick={clearAllNotifications} className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors">Clear All</button>
                                )}
                                {unreadCount > 0 && <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">{unreadCount} New</span>}
                              </div>
                          </div>
                         <div className="max-h-80 overflow-y-auto custom-scrollbar">
                             {notifications.length === 0 ? (
                                <div className="text-center p-6 text-slate-400 font-medium text-sm">No notifications yet</div>
                             ) : (
                                notifications.map(n => (
                                   <div key={n._id} className={`group px-4 py-3 hover:bg-slate-50 border-l-2 transition-colors relative ${!n.read ? 'border-brand-500 bg-brand-50/20' : 'border-transparent'}`}>
                                      <div className="flex justify-between items-start gap-2">
                                         <p className="text-sm font-bold text-slate-800 flex-1">{n.message}</p>
                                         <button 
                                           onClick={() => deleteNotification(n._id)}
                                           className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                                         >
                                           <X className="w-3.5 h-3.5" />
                                         </button>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">{new Date(n.createdAt).toLocaleDateString()}</span>
                                   </div>
                                ))
                             )}
                         </div>
                      </div>
                   )}
                </div>
                )}

                {/* Profile Dropdown */}
                <div className="flex items-center pl-4 ml-2 border-l border-slate-200">
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-1 pr-2 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all focus:outline-none">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden border border-brand-100">
                        {user.profilePic ? (
                          <img src={getFileUrl(user.profilePic)} alt={user.name} className="w-full h-full object-cover" />
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
           {user ? (
            <div className="space-y-1">
               <div className="p-3 mb-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center overflow-hidden border border-brand-100">
                    {user.profilePic ? (
                      <img src={getFileUrl(user.profilePic)} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-brand-600 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-1 mb-6">
                 <div className="px-3 mb-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</span>
                 </div>
                 <Link to="/market" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                   <Gavel className="w-4 h-4 mr-3 text-slate-400" /> Marketplace
                 </Link>

                 {user.role !== 'Admin' && (
                   <Link to="/dashboard" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                     <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400" /> Dashboard
                   </Link>
                 )}

                 {user.role === 'Seller' && (
                   <Link to="/create-item" className="flex items-center px-3 py-2.5 rounded-lg text-brand-700 font-bold bg-brand-50 hover:bg-brand-100 transition-colors">
                     <Plus className="w-4 h-4 mr-3 text-brand-600" /> Sell Item
                   </Link>
                 )}

                 {user.role === 'Buyer' && (
                   <>
                     <Link to="/watchlist" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <Heart className="w-4 h-4 mr-3 text-slate-400" /> Watchlist
                     </Link>
                     <Link to="/cart" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <ShoppingBag className="w-4 h-4 mr-3 text-slate-400" /> Cart
                     </Link>
                     <Link to="/my-orders" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <List className="w-4 h-4 mr-3 text-slate-400" /> My Orders
                     </Link>
                   </>
                 )}

                 {user.role === 'Admin' && (
                   <>
                     <div className="mt-4 px-3 mb-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administration</span>
                     </div>
                     <Link to="/admin" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400" /> Overview
                     </Link>
                     <Link to="/admin/users" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <Users className="w-4 h-4 mr-3 text-slate-400" /> Manage Users
                     </Link>
                     <Link to="/admin/items" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <Package className="w-4 h-4 mr-3 text-slate-400" /> Manage Items
                     </Link>
                     <Link to="/admin/bids" className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                       <Gavel className="w-4 h-4 mr-3 text-slate-400" /> Manage Bids
                     </Link>
                   </>
                 )}
               </div>

               {user.role === 'Buyer' && (
                 <div className="mb-6">
                    <div className="px-3 mb-3 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notifications</span>
                       {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[10px] font-bold text-red-500 hover:text-red-600">Clear All</button>
                       )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 px-2 custom-scrollbar">
                       {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl">No notifications</div>
                       ) : (
                          notifications.map(n => (
                             <div key={n._id} className={`p-3 rounded-xl border transition-all flex justify-between items-start gap-3 ${!n.read ? 'bg-brand-50 border-brand-100' : 'bg-white border-slate-100'}`}>
                                <div>
                                   <p className="text-xs font-bold text-slate-800 leading-relaxed">{n.message}</p>
                                   <span className="text-[10px] font-bold text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                                </div>
                                <button onClick={() => deleteNotification(n._id)} className="p-1 text-slate-300 hover:text-red-500">
                                   <X className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
               )}

               <div className="border-t border-slate-100 pt-4 mb-2">
                 <div className="px-3 mb-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Settings</span>
                 </div>
                 <Link to={user.role === 'Admin' ? '/admin-account' : '/account'} className="flex items-center px-3 py-2.5 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                   <UserIcon className="w-4 h-4 mr-3 text-slate-400" /> Account Settings
                 </Link>
               </div>

               <button onClick={handleLogout} className="flex w-full items-center px-3 py-2.5 rounded-lg text-red-600 font-bold hover:bg-red-50 transition-colors">
                 <LogOut className="w-4 h-4 mr-3 text-red-500" /> Sign Out
               </button>
            </div>
           ) : (
            <div className="space-y-3 mt-2">
              <Link to="/login" className="block w-full text-center px-4 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-transform">Sign In</Link>
              <Link to="/register" className="block w-full text-center px-4 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md shadow-slate-900/20 active:scale-95 transition-transform">Get Started</Link>
            </div>
           )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;