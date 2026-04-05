import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Gavel, Trash2, AlertCircle, ChevronLeft, ChevronRight, User, Package, Calendar } from 'lucide-react';

const AdminBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemId, setItemId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchBids(); }, [currentPage, itemId]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/bids?page=${currentPage}&itemId=${itemId}`);
      setBids(data.bids); setTotalPages(data.pagination.total);
    } catch (e) { setError('Failed to load global ledger'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (bidId) => {
    if (!window.confirm('IRREVERSIBLE ACTION: Destruct this transaction record forever?')) return;
    try {
      setDeleting(bidId); await api.delete(`/admin/bids/${bidId}`);
      setBids(bids.filter(b => b._id !== bidId));
    } catch (e) { alert('Transaction wipe failed'); } 
    finally { setDeleting(null); }
  };

  const formatAmount = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <div className="p-3 bg-green-50 rounded-2xl"><Gavel className="w-8 h-8 text-green-600" /></div>
               Transaction Ledger
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Investigate and obliterate platform bidding trails.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 font-bold shadow-sm">
            <AlertCircle className="w-6 h-6" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Target</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Injected</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bids.map(bid => (
                    <tr key={bid._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {bid.bidder?.name?.charAt(0).toUpperCase() || 'X'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{bid.bidder?.name || 'Ghost Identity'}</p>
                            <p className="text-xs text-slate-500 font-medium">{bid.bidder?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Package className="w-4 h-4" /></div>
                          <div>
                              <Link to={`/item/${bid.item?._id}`} className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1 block max-w-[200px] uppercase">
                                {bid.item?.title || 'Purged Asset'}
                              </Link>
                              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">
                                Ceiling: <span className="text-slate-700">{formatAmount(bid.item?.currentBid || 0)}</span>
                              </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-green-50 text-green-700 border border-green-100 shadow-sm">
                          {formatAmount(bid.amount)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(bid.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end">
                        <button
                          onClick={() => handleDelete(bid._id)}
                          disabled={deleting === bid._id}
                          className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 hover:text-red-700 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                          {deleting === bid._id ? 'Purging...' : <><Trash2 className="w-4 h-4" /> Erase</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {bids.length === 0 && (
                <div className="p-20 text-center text-slate-400">
                  <Gavel className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-black text-slate-900 mb-2">Ledger Blank</p>
                  <p className="font-medium text-slate-500">No transactions recorded in the system.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-6 border-t border-slate-100 bg-slate-50/50">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBids;