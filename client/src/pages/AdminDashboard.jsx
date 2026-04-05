import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, Package, Gavel, Timer, Archive, Ban, DollarSign, Activity, ArrowRight, ActivitySquare
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
    } catch (error) {
      setError('Failed to load dashboard metrics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6">
        <div className="bg-red-50 text-red-700 px-8 py-6 rounded-[2rem] border border-red-200 shadow-xl shadow-red-100 flex items-center gap-4 max-w-md w-full">
           <Ban className="w-8 h-8 flex-shrink-0" />
           <span className="font-extrabold">{error}</span>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, color, bg }) => (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 group hover:-translate-y-1 overflow-hidden relative">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl ${bg}`}></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">{title}</p>
          <h3 className="text-4xl font-black text-slate-900 group-hover:text-slate-700 transition-colors">
            {value !== undefined ? value.toLocaleString() : '-'}
          </h3>
        </div>
        <div className={`p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 ${color} transition-transform group-hover:scale-110 duration-300 shadow-sm`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 sm:p-10 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-brand-50 to-transparent"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <ActivitySquare className="w-10 h-10 text-brand-600" /> Executive Overview
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Platform metrics & global system health.</p>
          </div>
          <div className="relative z-10 px-5 py-3 bg-green-50 rounded-xl border border-green-200 text-sm font-bold text-green-700 shadow-sm flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse ring-4 ring-green-200"></span>
             All Systems Operational
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {stats && (
            <>
              <StatCard icon={Users} title="Global Users" value={stats.totalUsers} color="text-blue-600" bg="bg-blue-600" />
              <StatCard icon={Package} title="Total Listed Items" value={stats.totalItems} color="text-purple-600" bg="bg-purple-600" />
              <StatCard icon={DollarSign} title="Total Economy Bids" value={stats.totalBids} color="text-green-600" bg="bg-green-600" />
              <StatCard icon={Timer} title="Active Auctions" value={stats.activeAuctions} color="text-brand-600" bg="bg-brand-600" />
              <StatCard icon={Archive} title="Closed Vaults" value={stats.endedAuctions} color="text-slate-600" bg="bg-slate-600" />
              <StatCard icon={Ban} title="Banned Identities" value={stats.bannedUsers} color="text-red-600" bg="bg-red-600" />
            </>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Users */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[550px] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-3 text-xl">
                <Users className="w-6 h-6 text-blue-600" /> User Influx
              </h3>
              <Link to="/admin/users" className="text-[10px] font-black tracking-widest uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors group bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                Data <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
              {recentActivity?.users?.length > 0 ? (
                recentActivity.users.map(user => (
                  <div key={user._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-bold text-sm truncate">{user.name}</p>
                      <p className="text-slate-500 text-xs truncate font-medium">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'Seller' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Users className="w-10 h-10 mb-3 opacity-20" />
                   <span className="font-bold">No recent accounts</span>
                 </div>
              )}
            </div>
          </div>

          {/* Recent Items */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[550px] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-3 text-xl">
                <Package className="w-6 h-6 text-purple-600" /> New Listings
              </h3>
              <Link to="/admin/items" className="text-[10px] font-black tracking-widest uppercase text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors group bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                Data <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
              {recentActivity?.items?.length > 0 ? (
                recentActivity.items.map(item => (
                  <div key={item._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-bold text-sm truncate">{item.title}</p>
                      <p className="text-slate-500 text-xs truncate flex items-center gap-1 font-medium mt-1">
                         from <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{item.seller?.name || 'Unknown'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-black text-sm">${item.currentBid || item.basePrice}</p>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Package className="w-10 h-10 mb-3 opacity-20" />
                   <span className="font-bold">No recent listings</span>
                 </div>
              )}
            </div>
          </div>

          {/* Recent Bids */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-[550px] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-3 text-xl">
                <Activity className="w-6 h-6 text-green-600" /> Bid Velocity
              </h3>
              <Link to="/admin/bids" className="text-[10px] font-black tracking-widest uppercase text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors group bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                Data <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
              {recentActivity?.bids?.length > 0 ? (
                recentActivity.bids.map(bid => (
                  <div key={bid._id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                    <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 text-green-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Gavel className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-600 font-black text-lg leading-none mb-1">${bid.amount}</p>
                      <p className="text-slate-500 text-xs truncate leading-relaxed">
                        <span className="font-bold text-slate-900">{bid.bidder?.name}</span> bid on <span className="font-medium italic text-slate-700">{bid.item?.title}</span>
                      </p>
                    </div>
                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Gavel className="w-10 h-10 mb-3 opacity-20" />
                   <span className="font-bold">No bid activity</span>
                 </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;