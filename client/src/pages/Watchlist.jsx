import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Heart, ArrowRight, Gavel } from 'lucide-react';

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/users/watchlist');
      setItems(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (e, itemId) => {
    e.preventDefault(); // Prevent navigation
    try {
        await api.post('/users/watchlist', { itemId });
        setItems(items.filter(item => item._id !== itemId));
    } catch (error) {
        console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-current" /> My Watchlist
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-medium text-gray-600 mb-4">Your watchlist is empty</h2>
            <Link to="/" className="inline-flex items-center text-indigo-600 font-semibold hover:underline">
              Browse Auctions <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item._id} to={`/item/${item._id}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => removeFromWatchlist(e, item._id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-medium text-white">
                     {item.status.toUpperCase()}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm">
                        <p className="text-gray-500">Current Bid</p>
                        <p className="font-bold text-indigo-600">${item.currentBid || item.basePrice}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;