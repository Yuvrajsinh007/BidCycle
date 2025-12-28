import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import debounce from '../utils/debounce';
import { 
  Search, Filter, Tag, Clock, DollarSign, User, 
  ChevronLeft, ChevronRight, Image as ImageIcon, 
  ArrowRight, CheckCircle, XCircle, AlertCircle, Calendar 
} from 'lucide-react';

const Home = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [category, setCategory] = useState('');
  
  // Default to 'active' which backend now interprets as Active + Upcoming
  const [status, setStatus] = useState('active'); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  const [, setTick] = useState(0);

  useEffect(() => {
    const query = searchParams.get('search') || '';
    setInputValue(query);
    setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoadingItems(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category: category,
        status: status
      });
      
      const response = await api.get(`/items?${params}`);
      setItems(response.data.items);
      setTotalPages(response.data.pagination.total);
      setHasNext(response.data.pagination.hasNext);
      setHasPrev(response.data.pagination.hasPrev);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoadingItems(false);
    }
  }, [currentPage, searchTerm, category, status]);
  
  const debouncedUpdate = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedUpdate(value);
  };

  useEffect(() => {
    if (user) fetchItems();
  }, [user, fetchItems]);

  if (!loading && !user) return <Navigate to="/login" />;

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setCurrentPage(1);
  };

  // --- DYNAMIC TIMER LOGIC ---
  const formatTimer = (item) => {
    const now = new Date();
    const start = item.startTime ? new Date(item.startTime) : new Date();
    const end = new Date(item.endTime);
    
    // UPCOMING: Check STRICTLY against time
    if (now < start) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) return `Starts: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        return `Starts: ${hours}h ${minutes}m ${seconds}s`;
    }

    // ACTIVE:
    const diff = end - now;
    if (diff <= 0) return 'Auction ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    return `${hours}h ${minutes}m ${seconds}s left`;
  };

  // --- STRICT BADGE LOGIC ---
  const getStatusBadge = (item) => {
    const now = new Date();
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    
    // 1. Check if actually Upcoming (Future Start)
    if (now < start) {
        return (
          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 shadow-sm backdrop-blur-md">
            <Calendar className="w-3 h-3" /> Upcoming
          </span>
        );
    } 
    // 2. Check if Sold/Closed/Expired
    else if (item.status === 'sold') {
      return (
        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 shadow-sm backdrop-blur-md">
          <CheckCircle className="w-3 h-3" /> Sold
        </span>
      );
    } else if (item.status === 'closed') {
      return (
        <span className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200 shadow-sm backdrop-blur-md">
          <XCircle className="w-3 h-3" /> Closed
        </span>
      );
    } else if (end <= now || item.status === 'expired') {
      return (
        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200 shadow-sm backdrop-blur-md">
          <Clock className="w-3 h-3" /> Expired
        </span>
      );
    } 
    // 3. Otherwise, it is Active
    else {
      return (
        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-sm backdrop-blur-md">
          <AlertCircle className="w-3 h-3" /> Active
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8 text-center bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-[2px]"></div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Discover Unique Auctions
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto font-light">
              Bid on exclusive items, collectibles, and rare finds in real-time.
            </p>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 sticky top-4 z-20 transition-shadow hover:shadow-md">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for items..."
                value={inputValue}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all duration-200 hover:bg-white"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="block w-full pl-9 pr-8 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50 hover:bg-white shadow-sm cursor-pointer transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                  <option value="Collectibles">Collectibles</option>
                  <option value="Art">Art</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="relative w-full md:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="block w-full pl-9 pr-8 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-gray-50 hover:bg-white shadow-sm cursor-pointer transition-colors"
                >
                  <option value="active">Active & Upcoming</option>
                  <option value="ended">Ended</option>
                  <option value="">All Status</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Content Area */}
        {loadingItems ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-gray-500 font-medium animate-pulse">Finding treasures...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-center animate-fadeIn">
                  <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No items found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    We couldn't find any items matching your search. Try adjusting your filters or search term.
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <Link 
                    key={item._id} 
                    to={`/item/${item._id}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full animate-fadeIn"
                  >
                    {/* Image Container */}
                    <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                          <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                          <span className="text-sm font-medium">No Image</span>
                        </div>
                      )}
                      
                      {/* Floating Badges - DYNAMICALLY SET */}
                      <div className="absolute top-3 right-3 z-10">
                        {getStatusBadge(item)}
                      </div>
                      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-gray-100 flex items-center gap-1 uppercase tracking-wide">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {item.category}
                      </div>
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-grow relative">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                                {new Date() < new Date(item.startTime) ? 'Starting Bid' : 'Current Bid'}
                            </p>
                            <div className="flex items-center gap-1 text-indigo-600 font-extrabold text-xl">
                              <DollarSign className="w-5 h-5" strokeWidth={3} />
                              {item.currentBid || item.basePrice}
                            </div>
                          </div>
                          <div className="text-right">
                             <div className={`flex items-center justify-end gap-1 text-sm font-bold ${
                                new Date() < new Date(item.startTime)
                                  ? 'text-blue-600' 
                                  : new Date(item.endTime) < new Date() ? 'text-gray-400' : 'text-amber-600'
                             }`}>
                               <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                               {formatTimer(item)}
                             </div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                {new Date() < new Date(item.startTime) ? 'Starts In' : 'Time Left'}
                             </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                              <User className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <span className="truncate max-w-[100px] font-medium">{item.seller?.name || 'Unknown'}</span>
                          </div>
                          
                          <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2 animate-fadeIn">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrev}
                  className="flex items-center gap-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                
                <span className="px-4 py-2 text-gray-600 font-medium bg-white border border-gray-200 rounded-lg shadow-sm">
                  Page <span className="text-indigo-600 font-bold">{currentPage}</span> of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNext}
                  className="flex items-center gap-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;