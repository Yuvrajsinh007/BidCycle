import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Heart, ArrowRight, Clock, XCircle, Search, Filter } from 'lucide-react';

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const { data } = await api.get('/users/watchlist');
      setItems(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const removeFromWatchlist = async (e, itemId) => {
    e.preventDefault(); 
    try {
        await api.post('/users/watchlist', { itemId });
        setItems(items.filter(item => item._id !== itemId));
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <span className="p-3 bg-red-50 rounded-2xl"><Heart className="w-8 h-8 text-red-500 fill-current" /></span>
              Watchlist
            </h1>
            <p className="text-slate-500 font-medium mt-2">Monitor your favorite auctions and track their progress.</p>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{items.length} Saved Items</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-16 text-center max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Your watchlist is empty</h2>
            <p className="text-slate-500 font-medium mb-8">Items you favorite will appear here so you can easily track their bidding progress.</p>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-black px-8 py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
              Browse Auctions <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {items.map((item) => {
              const now = new Date();
              const end = new Date(item.endTime);
              const isEnded = ['sold', 'expired', 'closed'].includes(item.status) || now >= end;

              return (
                <Link key={item._id} to={`/item/${item._id}`} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <button 
                      onClick={(e) => removeFromWatchlist(e, item._id)}
                      className="absolute top-4 right-4 p-3 bg-white/95 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg hover:scale-110 active:scale-90"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                    
                    <div className="absolute top-4 left-4">
                       {isEnded ? <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3"/> Closed</span>
                       : <span className="bg-brand-500/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"><Clock className="w-3 h-3"/> Active</span>}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-4 group-hover:text-brand-600 transition-colors">{item.title}</h3>
                    
                    <div className="mt-auto border-t border-slate-100 pt-4 flex justify-between items-end">
                      <div>
                          <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1">Current Bid</p>
                          <p className="text-2xl font-black text-slate-900">${item.currentBid || item.basePrice}</p>
                      </div>
                      <div className="text-right pb-1">
                          <span className="text-brand-600 font-bold text-sm flex items-center gap-1">View <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/></span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;