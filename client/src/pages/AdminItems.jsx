import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import debounce from '../utils/debounce';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Clock, 
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  User,
  MoreHorizontal
} from 'lucide-react';

const AdminItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const debouncedUpdate = useCallback(
    debounce((value) => {
      setSearch(value);
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
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, status]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/items?page=${currentPage}&search=${search}&status=${status}`);
      setItems(response.data.items);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      setError('Failed to load items');
      console.error('Fetch items error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
      setDeleting(itemId);
      await api.delete(`/admin/items/${itemId}`);
      setItems(items.filter(item => item._id !== itemId));
    } catch (error) {
      alert('Failed to delete item');
      console.error('Delete item error:', error);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (item) => {
    const now = new Date();
    const endTime = new Date(item.endTime);

    if (item.status === 'sold') 
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sold</span>;
    if (item.status === 'closed') 
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Closed</span>;
    if (endTime <= now) 
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Items</h1>
          <p className="text-gray-500 mt-2">Monitor and moderate auction listings</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items by title..."
                value={inputValue}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {items.map(item => {
                const isActive = item.status === 'active' && new Date(item.endTime) > new Date();
                
                return (
                  <div key={item._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                    {/* Image Area */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Package className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-sm">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {getStatusBadge(item)}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={item.title}>
                          {item.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <User className="w-4 h-4" />
                        <span className="truncate">Seller: {item.seller?.name || 'Unknown'}</span>
                      </div>

                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Current Bid</p>
                            <p className="text-lg font-bold text-indigo-600">${item.currentBid || item.basePrice}</p>
                          </div>
                          {isActive && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-medium uppercase">Ends In</p>
                              <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                                <Clock className="w-3 h-3" />
                                {formatTimeRemaining(item.endTime)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            to={`/item/${item._id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" /> View
                          </Link>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deleting === item._id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deleting === item._id ? '...' : <><Trash2 className="w-4 h-4" /> Delete</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {items.length === 0 && (
              <div className="p-12 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-lg">No items found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminItems;