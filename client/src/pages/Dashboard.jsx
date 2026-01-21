import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { 
  Package, 
  ShoppingBag, 
  Gavel, 
  Trophy, 
  CreditCard, 
  Plus, 
  List, 
  Clock, 
  DollarSign,
  TrendingUp,
  ArrowRight,
  Activity
} from 'lucide-react';

// --- SELLER DASHBOARD COMPONENT ---
const SellerDashboard = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await api.get('/seller/items'); // Endpoint might differ based on your backend
        setItems(data);
      } catch (error) {
        console.error("Fetch items error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const activeItems = items.filter(i => new Date(i.endTime) > new Date()).length;
  const soldItems = items.filter(i => new Date(i.endTime) <= new Date()).length; // Assuming ended means potentially sold
  
  const totalRevenue = items
    .filter(i => new Date(i.endTime) <= new Date()) 
    .reduce((acc, curr) => acc + (curr.currentBid || curr.basePrice || 0), 0); // Simplified calculation

  const recentInventory = sortedItems.slice(0, 5);

  if (loading) {
     return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Active Listings</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{activeItems}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Completed Auctions</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{soldItems}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Potential Revenue</p>
            <h3 className="text-3xl font-extrabold text-gray-900">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/create-item" 
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" /> Create New Auction
        </Link>
        <Link 
          to="/my-items" 
          className="flex-1 bg-white border border-gray-200 text-gray-700 p-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <List className="w-5 h-5" /> Manage Inventory
        </Link>
      </div>

      {/* Recent Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Recent Inventory
          </h2>
          <Link to="/my-items" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
             View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
            {recentInventory.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Date Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentInventory.map((item) => {
                            const isEnded = new Date(item.endTime) < new Date();
                            return (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                                {item.images?.[0] ? (
                                                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-2 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 truncate max-w-[150px]">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            !isEnded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {!isEnded ? 'Active' : 'Ended'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-700">
                                        ${item.currentBid || item.basePrice}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No items listed yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- BUYER DASHBOARD COMPONENT ---
const BuyerDashboard = ({ user }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const { data } = await api.get('/bids/my-bids'); // Adjust endpoint if needed
        setBids(data);
      } catch (error) {
        console.error("Fetch bids error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const activeBids = bids.filter(b => b.item && new Date(b.item.endTime) > new Date());
  // Assuming a winner logic exists or simply checking if ended
  const wonAuctions = bids.filter(b => b.item && new Date(b.item.endTime) <= new Date() && b.item.currentBid === b.amount); // Simple logic: if my bid is current bid when ended. Ideally, backend tells you.

  // Deduplicate won items logic
  const uniqueWonMap = new Map();
  wonAuctions.forEach(bid => {
      const existing = uniqueWonMap.get(bid.item._id);
      if (!existing || bid.amount > existing.amount) {
          uniqueWonMap.set(bid.item._id, bid);
      }
  });
  const uniqueWonItems = Array.from(uniqueWonMap.values());

  const totalSpent = uniqueWonItems.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) {
     return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
       {/* Buyer Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Gavel className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Active Bids</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{activeBids.length}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Auctions Won</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{uniqueWonItems.length}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-300">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Total Committed</p>
            <h3 className="text-3xl font-extrabold text-gray-900">${totalSpent.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="flex">
        <Link to="/" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Browse Auctions
        </Link>
      </div>

      {/* Recent Bids Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Recent Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
             {bids.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Your Bid</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bids.slice(0, 5).map((bid) => {
                             const isEnded = bid.item && new Date(bid.item.endTime) < new Date();
                             // Logic to determine if winning/won could be complex without backend flag, simplified here
                             const isWinning = bid.item && bid.amount === bid.item.currentBid;

                            return (
                                <tr key={bid._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                                {bid.item?.images?.[0] ? (
                                                    <img src={bid.item.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">N/A</div>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 truncate max-w-[150px]">
                                                {bid.item?.title || <span className="text-gray-400 italic">Item Deleted</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-indigo-600">
                                        ${bid.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        {bid.item ? (
                                            isEnded ? (
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isWinning ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {isWinning ? <><Trophy className="w-3 h-3"/> Won</> : 'Ended'}
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isWinning ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {isWinning ? 'Winning' : 'Outbid'}
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-gray-400 text-xs">Unknown</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(bid.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             ) : (
                <div className="p-8 text-center text-gray-500">
                    <Gavel className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No bids placed yet.</p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD CONTAINER ---
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span></p>
        </div>

        {user.role === 'Seller' ? <SellerDashboard user={user} /> : <BuyerDashboard user={user} />}
      </div>
    </div>
  );
};

export default Dashboard;