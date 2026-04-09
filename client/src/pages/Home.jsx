import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import debounce from '../utils/debounce';
import AuctionCard from '../components/ui/AuctionCard';
import { 
  Search, Filter, Tag, 
  ChevronLeft, ChevronRight, 
  ArrowRight, SearchX, Shapes,
  Gavel, ShoppingBag, Layers
} from 'lucide-react';

const CATEGORIES = [
  "All Categories", "Electronics", "Fashion", "Home & Garden", "Sports", 
  "Books", "Collectibles", "Art", "Jewelry", "Automotive", "Other"
];

const Home = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active'); 
  const [listingType, setListingType] = useState('all'); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const query = searchParams.get('search') || '';
    setInputValue(query);
    setSearchTerm(query);
  }, [searchParams]);

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
      if (listingType !== 'all') {
        params.append('listingType', listingType);
      }
      
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
  }, [currentPage, searchTerm, category, status, listingType]);
  
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

  const handleCategoryChange = (val) => {
    setCategory(val === "All Categories" ? "" : val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setStatus(val);
    setCurrentPage(1);
  };
  
  const handleTypeChange = (val) => {
    setListingType(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      
      {/* Sleek Hero Section */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-24 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-50"></div>
          <div className="relative z-10 max-w-3xl space-y-6 animate-slideUp">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-400/10 rounded-full border border-brand-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              Live Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-none">
            The Ultimate <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Hybrid Marketplace</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl font-medium">
            Discover rare items in live auctions or buy them instantly with direct sales.
          </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Modern Filter Bar */}
        <div className="bg-white p-3 lg:p-2 rounded-2xl shadow-sm border border-slate-200 mb-6 md:mb-8 sticky top-20 md:top-24 z-30 transition-shadow hover:shadow-md flex flex-col lg:flex-row gap-3 md:gap-2">
          
          {/* Main Search */}
          <div className="relative flex-grow flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
             <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
             <input
                type="text"
                placeholder="Search premium items..."
                value={inputValue}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-slate-900 placeholder-slate-400 px-3"
              />
          </div>

          <div className="h-px lg:h-auto lg:w-px bg-slate-200 mx-2 hidden lg:block"></div>

          {/* Quick Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
             
             {/* Filter Groups - Horizontally Scrollable on Mobile */}
             <div className="flex lg:items-center gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide -mx-1 px-1">
                {/* Status Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-max border border-slate-200 flex-shrink-0">
                  <button 
                      onClick={() => handleStatusChange('active')}
                      className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${status === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Live Listings
                  </button>
                  <button 
                      onClick={() => handleStatusChange('upcoming')}
                      className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${status === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Upcoming
                  </button>
                  <button 
                      onClick={() => handleStatusChange('ended')}
                      className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${status === 'ended' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Ended
                  </button>
                </div>

                {/* Type Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-max border border-slate-200 flex-shrink-0">
                  <button 
                      onClick={() => handleTypeChange('all')}
                      className={`px-3 md:px-4 py-1.5 flex items-center gap-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${listingType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Layers className="w-3 h-3" /> All
                  </button>
                  <button 
                      onClick={() => handleTypeChange('auction')}
                      className={`px-3 md:px-4 py-1.5 flex items-center gap-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${listingType === 'auction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Gavel className="w-3 h-3" /> Auctions
                  </button>
                  <button 
                      onClick={() => handleTypeChange('direct')}
                      className={`px-3 md:px-4 py-1.5 flex items-center gap-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${listingType === 'direct' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ShoppingBag className="w-3 h-3" /> Buy Now
                  </button>
                </div>

                {/* Category Select (Sleek) */}
                <div className="relative group min-w-[140px] flex-shrink-0">
                    <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-100 transition-colors w-full cursor-pointer">
                      <Shapes className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={category || "All Categories"}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 text-[10px] md:text-sm font-bold text-slate-700 cursor-pointer appearance-none outline-none"
                      >
                        {CATEGORIES.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        {loadingItems ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-800"></div>
              <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">Loading Items...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {items.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center animate-fadeIn">
                  <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                    <SearchX className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No items found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">
                    Try adjusting your filters, category, or search term to discover items.
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <AuctionCard key={item._id} item={item} />
                ))
              )}
            </div>

            {/* Premium Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-4 animate-fadeIn">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrev}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm font-bold text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                
                <span className="text-sm font-semibold text-slate-500">
                  <span className="text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm mx-1">{currentPage}</span> 
                  of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm font-bold text-sm"
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