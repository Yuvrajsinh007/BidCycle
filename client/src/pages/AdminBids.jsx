import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Gavel, 
  Trash2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Package, 
  Calendar 
} from 'lucide-react';

const AdminBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemId, setItemId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchBids();
  }, [currentPage, itemId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/bids?page=${currentPage}&itemId=${itemId}`);
      setBids(response.data.bids);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      setError('Failed to load bids');
      console.error('Fetch bids error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bidId) => {
    if (!window.confirm('Are you sure you want to delete this bid? This action cannot be undone.')) return;

    try {
      setDeleting(bidId);
      await api.delete(`/admin/bids/${bidId}`);
      setBids(bids.filter(bid => bid._id !== bidId));
    } catch (error) {
      alert('Failed to delete bid');
      console.error('Delete bid error:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatAmount = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Bids</h1>
          <p className="text-gray-500 mt-2">Oversee all bidding activity across the platform</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bidder</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bids.map(bid => (
                      <tr key={bid._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {bid.bidder?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{bid.bidder?.name || 'Unknown'}</p>
                              <p className="text-gray-500 text-xs">{bid.bidder?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <Link 
                              to={`/item/${bid.item?._id}`} 
                              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate max-w-[200px]"
                            >
                              {bid.item?.title || 'Unknown Item'}
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 ml-6">
                            Current: {formatAmount(bid.item?.currentBid || 0)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            {formatAmount(bid.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(bid.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(bid._id)}
                            disabled={deleting === bid._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === bid._id ? (
                              'Deleting...'
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bids.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Gavel className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg">No bids found.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBids;