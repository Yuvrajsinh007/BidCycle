import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Gavel
} from 'lucide-react';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // Default to 'active' (Active + Upcoming)
  const [searchQuery, setSearchQuery] = useState('');
  
  // LIVE TIMER STATE: Triggers re-render every second to update countdowns and statuses
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchMyItems();
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seller/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load your items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete(`/seller/items/${itemId}`);
      setItems(items.filter(item => item._id !== itemId));
      setError(''); 
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete item');
      setTimeout(() => setError(''), 5000);
    }
  };

  // --- UPDATED TIMER LOGIC ---
  // Calculates string based on whether we are counting down to Start or End
  const formatTimer = (item) => {
    const now = new Date();
    const start = item.startTime ? new Date(item.startTime) : new Date(); 
    const end = new Date(item.endTime);

    // 1. UPCOMING LOGIC (Count down to Start)
    if (now < start) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // 2. ACTIVE LOGIC (Count down to End)
    const diff = end - now;
    if (diff <= 0) return '00s';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const filteredItems = items.filter(item => {
    // Strictly use Time comparisons for filtering logic to match the visuals
    const now = new Date();
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);

    const isEnded = ['sold', 'expired', 'closed'].includes(item.status) || now >= end;
    const isUpcoming = now < start; 
    const isActive = !isUpcoming && !isEnded; // Specifically currently running

    // Filter Logic
    let matchesFilter = false;
    if (filter === 'all') matchesFilter = true;
    else if (filter === 'active') matchesFilter = isActive || isUpcoming; // Active tab shows BOTH Active & Upcoming
    else if (filter === 'ended') matchesFilter = isEnded;
    
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Listings</h1>
            <p className="text-gray-500 mt-1">Manage and track your auction items</p>
          </div>
          <Link
            to="/create-item"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Item
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Listed</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Gavel className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active & Upcoming</p>
              <p className="text-2xl font-bold text-green-600">
                {items.filter(i => new Date(i.endTime) > new Date()).length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
              <p className="text-sm font-medium text-gray-500">Ended Auctions</p>
              <p className="text-2xl font-bold text-gray-600">
                 {items.filter(i => new Date(i.endTime) <= new Date()).length}
              </p>
            </div>
             <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
              {['all', 'active', 'ended'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === type
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type === 'active' ? 'Active & Upcoming' : type}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-fadeIn">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Content Area */}
        {filteredItems.length === 0 ? (
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No items found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new listing.</p>
             {filter === 'all' && searchQuery === '' && (
                 <Link
                 to="/create-item"
                 className="inline-block mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
               >
                 Create Item
               </Link>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const now = new Date();
              const start = new Date(item.startTime);
              const end = new Date(item.endTime);

              // STRICT TIME-BASED STATUS CHECKS (Reactive to live ticker)
              const isEnded = ['sold', 'expired', 'closed'].includes(item.status) || now >= end;
              const isUpcoming = now < start;
              
              // Only consider it "Active" if it's not ended and strictly past the start time
              const isActive = !isUpcoming && !isEnded;

              return (
                <div key={item._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  {/* Image Container */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                    
                    {/* Status Badge - VISUALLY SEPARATE */}
                    <div className="absolute top-3 right-3">
                      {isUpcoming ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/90 text-white backdrop-blur-md shadow-sm">
                            <Calendar className="w-3 h-3" /> Upcoming
                         </span>
                      ) : isEnded ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-900/80 text-white backdrop-blur-md">
                            <XCircle className="w-3 h-3" /> Ended
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/90 text-white backdrop-blur-md">
                            <Clock className="w-3 h-3" /> Active
                         </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                         <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={item.title}>
                            {item.title}
                        </h3>
                    </div>
                   
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                        {item.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-gray-50">
                        
                        {/* DYNAMIC CONTENT based on status */}
                        {isUpcoming ? (
                           <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Starts On</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {start.toLocaleDateString()} at {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-blue-600">
                                <Clock className="w-3 h-3" /> Starts in {formatTimer(item)}
                              </div>
                           </div>
                        ) : (
                           // ACTIVE/ENDED Display
                           <div className="mb-4">
                               <div className="flex justify-between items-end mb-2">
                                   <div>
                                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Bid</p>
                                      <p className="text-xl font-bold text-indigo-600">
                                          ${item.currentBid || item.basePrice}
                                      </p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bids</p>
                                      <p className="text-lg font-semibold text-gray-700">{item.bidCount || 0}</p>
                                   </div>
                               </div>
                               {!isEnded && (
                                   <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600">
                                      <Clock className="w-3 h-3" /> Ends in {formatTimer(item)}
                                   </div>
                               )}
                           </div>
                        )}

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to={`/item/${item._id}`}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                                <Eye className="w-4 h-4" /> View
                            </Link>
                            
                            {!isEnded ? (
                                <Link
                                    to={`/edit-item/${item._id}`}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </Link>
                            ) : (
                                <Link
                                    to={`/item/${item._id}`} 
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    <Gavel className="w-4 h-4" /> Bids
                                </Link>
                            )}

                             <button
                                onClick={() => handleDelete(item._id)}
                                className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Item
                            </button>
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