import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Plus, Search, Filter, Trash2, Edit, Eye, Clock, 
  CheckCircle2, XCircle, AlertCircle, Calendar, Gavel
} from 'lucide-react';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchMyItems();
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seller/items');
      setItems(data);
    } catch (e) { setError('Failed to load inventory'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    try {
      await api.delete(`/seller/items/${itemId}`);
      setItems(items.filter(i => i._id !== itemId));
    } catch (e) { setError('Failed to delete item'); setTimeout(() => setError(''), 3000); }
  };

  const formatTimer = (item) => {
    const now = new Date(), start = new Date(item.startTime || new Date()), end = new Date(item.endTime);
    const target = now < start ? start : end;
    const diff = target - now;
    if (diff <= 0) return '00s';

    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    return d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
  };

  const filteredItems = items.filter(item => {
    const now = new Date(), start = new Date(item.startTime), end = new Date(item.endTime);
    const isEnded = ['sold', 'expired', 'closed'].includes(item.status) || now >= end;
    const isUpcoming = now < start; 
    const isActive = !isUpcoming && !isEnded;

    let matchesFilter = filter === 'all' || (filter === 'active' && (isActive || isUpcoming)) || (filter === 'ended' && isEnded);
    return matchesFilter && item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-slate-500 font-medium mt-1">Track and manage your global listings.</p>
          </div>
          <Link to="/create-item" className="bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
             { t: "Total Listed", v: items.length, c: "bg-slate-100 text-slate-700", I: Gavel },
             { t: "Active & Upcoming", v: items.filter(i => new Date(i.endTime) > new Date()).length, c: "bg-brand-50 text-brand-600", I: Clock },
             { t: "Ended Auctions", v: items.filter(i => new Date(i.endTime) <= new Date()).length, c: "bg-blue-50 text-blue-600", I: CheckCircle2 }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black tracking-widest uppercase text-slate-400 mb-1">{s.t}</p>
                <p className="text-3xl font-black text-slate-900">{s.v}</p>
              </div>
              <div className={`p-4 rounded-xl ${s.c}`}><s.I className="w-6 h-6" /></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-8 sticky top-20 z-10 flex flex-col md:flex-row gap-2">
           <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search inventory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
           </div>
           <div className="flex bg-slate-50 p-1 rounded-xl shrink-0">
             {['all', 'active', 'ended'].map(t => (
               <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === t ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{t === 'active' ? 'Active/Up' : t}</button>
             ))}
           </div>
        </div>

        {error && <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex font-bold text-red-700"><AlertCircle className="w-5 h-5 mr-3"/> {error}</div>}

        {/* Content */}
        {filteredItems.length === 0 ? (
           <div className="bg-white rounded-[2rem] shadow-sm border border-dashed border-slate-300 p-16 text-center">
            <Filter className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">No listings found</h3>
            <p className="text-slate-500 font-medium">Try modifying your search or list a new item.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => {
              const now = new Date(), start = new Date(item.startTime), end = new Date(item.endTime);
              const isEnded = ['sold', 'expired', 'closed'].includes(item.status) || now >= end;
              const isUpcoming = now < start;
              
              return (
                <div key={item._id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col group">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">NO IMAGE</div>}
                    
                    <div className="absolute top-3 right-3">
                      {isUpcoming ? <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm"><Calendar className="w-3 h-3"/> Up</span>
                       : isEnded ? <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Ended</span>
                       : <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm"><Clock className="w-3 h-3"/> Active</span>}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-black text-slate-900 truncate mb-1" title={item.title}>{item.title}</h3>
                    <p className="text-sm font-medium text-slate-500 truncate mb-4">{item.description}</p>

                    <div className="mt-auto">
                        <div className="flex justify-between items-end mb-4 border-t border-slate-100 pt-4">
                            <div>
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Value</p>
                                <p className="text-xl font-black text-slate-900">₹{item.currentBid || item.basePrice}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Bids / Timer</p>
                                <p className="text-sm font-bold text-brand-600 tabular-nums">{isEnded ? "Closed" : formatTimer(item)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <Link to={`/item/${item._id}`} className="flex justify-center items-center gap-1 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100"><Eye className="w-4 h-4"/> View</Link>
                           {!isEnded ? <Link to={`/edit-item/${item._id}`} className="flex justify-center items-center gap-1 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100"><Edit className="w-4 h-4"/> Edit</Link>
                            : <Link to={`/item/${item._id}`} className="flex justify-center items-center gap-1 py-2 bg-brand-50 text-brand-600 font-bold rounded-xl hover:bg-brand-100"><Gavel className="w-4 h-4"/> Bids</Link>}
                           <button onClick={() => handleDelete(item._id)} className="col-span-2 py-2 text-sm font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4"/> Delete Listing</button>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyItems;