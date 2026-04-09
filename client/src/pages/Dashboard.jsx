import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { 
  Package, ShoppingBag, Gavel, Trophy, CreditCard, 
  Plus, List, TrendingUp, ArrowRight, Activity, Truck
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, colorClass }) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 md:gap-5 hover:border-slate-300 transition-colors">
    <div className={`p-3 md:p-4 rounded-xl ${colorClass}`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
    </div>
    <div>
      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  </div>
);

// --- SELLER DASHBOARD ---
const SellerDashboard = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/items')
      .then(({data}) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeItems = items.filter(i => {
    if (i.listingType === 'direct') return i.stock > 0;
    return new Date(i.endTime) > new Date();
  }).length;
  const soldItems = items.filter(i => {
    if (i.listingType === 'direct') return false; // Handled separately
    return new Date(i.endTime) <= new Date();
  }).length;
  
  const directSales = items.reduce((acc, curr) => {
     if (curr.listingType === 'direct' && curr.stock === 0) return acc + 1;
     return acc;
  }, 0);

  const totalRevenue = items
    .filter(i => new Date(i.endTime) <= new Date())
    .reduce((acc, curr) => acc + (curr.currentBid || curr.basePrice || 0), 0);
  
  const recentInventory = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900"></div></div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Package} title="Active Listings" value={activeItems} colorClass="bg-blue-50 text-blue-600" />
        <StatCard icon={Trophy} title="Auctions Ended" value={soldItems} colorClass="bg-brand-50 text-brand-600" />
        <StatCard icon={ShoppingBag} title="Direct Sold Out" value={directSales} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard icon={CreditCard} title="Est. Auction Value" value={`₹${totalRevenue.toLocaleString()}`} colorClass="bg-slate-100 text-slate-700" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/create-item" className="flex-1 bg-slate-900 text-white p-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-bold">
          <Plus className="w-5 h-5" /> Host New Auction
        </Link>
        <Link to="/seller-orders" className="flex-1 bg-brand-600 text-white p-4 rounded-xl shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 font-bold">
          <Truck className="w-5 h-5" /> Fulfill Orders
        </Link>
        <Link to="/my-items" className="flex-1 bg-white border border-slate-200 text-slate-700 p-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold shadow-sm">
          <List className="w-5 h-5" /> Manage Inventory
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" /> Recent Inventory
          </h2>
          <Link to="/my-items" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
             View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentInventory.length > 0 ? (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                  <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Current Price</th>
                      <th className="px-6 py-4">Date Added</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {recentInventory.map((item) => {
                      const isEnded = new Date(item.endTime) < new Date();
                      return (
                          <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex-shrink-0">
                                          {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-slate-300" />}
                                      </div>
                                      <span className="font-bold text-slate-900 max-w-[200px] truncate">{item.title}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                                      !isEnded ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                      {!isEnded ? 'Active' : 'Ended'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 font-black text-slate-900">
                                ₹{item.currentBid || item.basePrice}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                                  {new Date(item.createdAt).toLocaleDateString()}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p className="font-medium text-sm">No items listed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- BUYER DASHBOARD ---
const BuyerDashboard = ({ user }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bids/my-bids')
      .then(({data}) => setBids(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeBids = bids.filter(b => b.item && new Date(b.item.endTime) > new Date());
  const wonAuctions = bids.filter(b => b.item && new Date(b.item.endTime) <= new Date() && b.item.currentBid === b.amount);
  
  const uniqueWonMap = new Map();
  wonAuctions.forEach(bid => {
      const existing = uniqueWonMap.get(bid.item._id);
      if (!existing || bid.amount > existing.amount) uniqueWonMap.set(bid.item._id, bid);
  });
  const uniqueWonItems = Array.from(uniqueWonMap.values());
  const totalSpent = uniqueWonItems.reduce((acc, curr) => acc + curr.amount, 0);

  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/orders/my-orders')
      .then(({data}) => setOrders(data))
      .catch(console.error);
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900"></div></div>;

  return (
    <div className="space-y-8 animate-fadeIn">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Gavel} title="Active Bids" value={activeBids.length} colorClass="bg-blue-50 text-blue-600" />
        <StatCard icon={Trophy} title="Auctions Won" value={uniqueWonItems.length} colorClass="bg-brand-50 text-brand-600" />
        <StatCard icon={Package} title="Direct Orders" value={orders.length} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard icon={CreditCard} title="Auction Value" value={`₹${totalSpent.toLocaleString()}`} colorClass="bg-slate-100 text-slate-700" />
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <Link to="/market" className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Browse Marketplace
        </Link>
        <Link to="/my-orders" className="flex-1 bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <List className="w-5 h-5" /> View My Orders
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" /> Recent Bidding Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
             {bids.length > 0 ? (
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Your Bid</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bids.slice(0, 5).map((bid) => {
                             const isEnded = bid.item && new Date(bid.item.endTime) < new Date();
                             const isWinning = bid.item && bid.amount === bid.item.currentBid;

                            return (
                                <tr key={bid._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex-shrink-0">
                                                {bid.item?.images?.[0] ? <img src={bid.item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6"/></div>}
                                            </div>
                                            <span className="font-bold text-slate-900 max-w-[200px] truncate">
                                                {bid.item?.title ? (
                                                  <Link to={`/item/${bid.item._id}`} className="hover:text-brand-600 transition-colors">{bid.item.title}</Link>
                                                ) : <span className="text-slate-400 italic font-medium">Item Removed</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900">
                                        ₹{bid.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        {bid.item ? (
                                            isEnded ? (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${isWinning ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isWinning ? 'Won' : 'Ended'}
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${isWinning ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {isWinning ? 'Winning' : 'Outbid'}
                                                </span>
                                            )
                                        ) : (
                                            <span className="bg-slate-100 text-slate-400 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider">Unknown</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                                        {new Date(bid.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             ) : (
                <div className="p-12 text-center text-slate-500">
                    <Gavel className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                    <p className="font-medium text-sm">No bids placed yet. Start exploring!</p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN WRAPPER ---
const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 border-b border-slate-200 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm md:text-base">
            Welcome back, <span className="font-bold text-slate-900">{user.name}</span>
          </p>
        </div>
        {user.role === 'Seller' ? <SellerDashboard user={user} /> : <BuyerDashboard user={user} />}
      </div>
    </div>
  );
};

export default Dashboard;