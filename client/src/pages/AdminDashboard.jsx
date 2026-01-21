import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, 
  Package, 
  Gavel, 
  Timer, 
  Archive, 
  Ban, 
  DollarSign, 
  Activity, 
  ArrowRight 
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
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-3">
           <Ban className="w-6 h-6" />
           <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, color, bg }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {value !== undefined ? value.toLocaleString() : '-'}
          </h3>
        </div>
        <div className={`p-4 rounded-xl ${bg} ${color} transition-colors group-hover:scale-110 duration-300`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Overview</h1>
            <p className="text-gray-500 mt-1">Monitor platform performance and key metrics</p>
          </div>
          <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-500 shadow-sm flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             System Operational
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats && (
            <>
              <StatCard 
                icon={Users} 
                title="Total Users" 
                value={stats.totalUsers} 
                color="text-blue-600" 
                bg="bg-blue-50" 
              />
              <StatCard 
                icon={Package} 
                title="Total Items" 
                value={stats.totalItems} 
                color="text-purple-600" 
                bg="bg-purple-50" 
              />
              <StatCard 
                icon={DollarSign} 
                title="Total Bids" 
                value={stats.totalBids} 
                color="text-green-600" 
                bg="bg-green-50" 
              />
              <StatCard 
                icon={Timer} 
                title="Active Auctions" 
                value={stats.activeAuctions} 
                color="text-amber-600" 
                bg="bg-amber-50" 
              />
              <StatCard 
                icon={Archive} 
                title="Ended Auctions" 
                value={stats.endedAuctions} 
                color="text-gray-600" 
                bg="bg-gray-100" 
              />
              <StatCard 
                icon={Ban} 
                title="Banned Users" 
                value={stats.bannedUsers} 
                color="text-red-600" 
                bg="bg-red-50" 
              />
            </>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" /> New Users
              </h3>
              <Link to="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group">
                View All <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
              {recentActivity?.users?.length > 0 ? (
                recentActivity.users.map(user => (
                  <div key={user._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      user.role === 'Seller' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <Users className="w-8 h-8 mb-2 opacity-50" />
                   <span className="text-sm">No recent users</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-purple-600" /> New Items
              </h3>
              <Link to="/admin/items" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors group">
                View All <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
              {recentActivity?.items?.length > 0 ? (
                recentActivity.items.map(item => (
                  <div key={item._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                           <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-gray-500 text-xs truncate flex items-center gap-1">
                         by <span className="font-medium text-gray-700">{item.seller?.name || 'Unknown'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-600 font-bold text-sm">${item.currentBid || item.basePrice}</p>
                      <p className="text-gray-400 text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <Package className="w-8 h-8 mb-2 opacity-50" />
                   <span className="text-sm">No recent items</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bids */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-green-600" /> Recent Bids
              </h3>
              <Link to="/admin/bids" className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors group">
                View All <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
              {recentActivity?.bids?.length > 0 ? (
                recentActivity.bids.map(bid => (
                  <div key={bid._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                      <Gavel className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm">${bid.amount}</p>
                      <p className="text-gray-500 text-xs truncate">
                        <span className="font-medium text-gray-800">{bid.bidder?.name}</span> on <span className="italic">{bid.item?.title}</span>
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <Gavel className="w-8 h-8 mb-2 opacity-50" />
                   <span className="text-sm">No recent bids</span>
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