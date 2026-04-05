import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import debounce from '../utils/debounce';
import { Search, Filter, Trash2, Eye, Clock, AlertCircle, Package, ChevronLeft, ChevronRight, User } from 'lucide-react';

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

  const debouncedUpdate = useCallback(debounce((value) => { setSearch(value); setCurrentPage(1); }, 500), []);
  const handleInputChange = (e) => { setInputValue(e.target.value); debouncedUpdate(e.target.value); };

  useEffect(() => { fetchItems(); }, [currentPage, search, status]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/items?page=${currentPage}&search=${search}&status=${status}`);
      setItems(data.items); setTotalPages(data.pagination.total);
    } catch (e) { setError('Failed to load items'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('IRREVERSIBLE ACTION: Obliterate this listing from the database?')) return;
    try {
      setDeleting(itemId); await api.delete(`/admin/items/${itemId}`);
      setItems(items.filter(i => i._id !== itemId));
    } catch (e) { alert('Failed to delete item'); } 
    finally { setDeleting(null); }
  };

  const getStatusBadge = (item) => {
    const end = new Date(item.endTime);
    if (item.status === 'sold') return <span className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Sold</span>;
    if (item.status === 'closed') return <span className="bg-slate-800/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Closed</span>;
    if (end <= new Date()) return <span className="bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Expired</span>;
    return <span className="bg-brand-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Active</span>;
  };

  const formatTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24)), h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <div className="p-3 bg-purple-50 rounded-2xl"><Package className="w-8 h-8 text-purple-600" /></div>
               Global Inventory
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Absolute control over all marketplace listings.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 font-bold shadow-sm">
            <AlertCircle className="w-6 h-6" /> {error}
          </div>
        )}

        {/* Global Filters */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Query inventory via nomenclature..." value={inputValue} onChange={handleInputChange} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-purple-500 outline-none transition-all" />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none cursor-pointer focus:border-purple-500 focus:bg-white transition-all appearance-none text-slate-700">
              <option value="">Status: Universal</option>
              <option value="active">Status: Active</option>
              <option value="ended">Status: Concluded</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-10">
              {items.map(item => {
                const isActive = item.status === 'active' && new Date(item.endTime) > new Date();
                return (
                  <div key={item._id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-300/40 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                    
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><Package className="w-10 h-10 mb-2 opacity-30" /></div>}
                      <div className="absolute top-4 right-4">{getStatusBadge(item)}</div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-2 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                        <User className="w-3 h-3 text-purple-500" /> {item.seller?.name || 'Unknown Entity'}
                      </div>

                      <div className="mt-auto space-y-4">
                        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Economy Base</p>
                            <p className="text-2xl font-black text-slate-900">${item.currentBid || item.basePrice}</p>
                          </div>
                          {isActive && (
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time To Live</p>
                              <div className="flex items-center gap-1 text-sm font-bold text-brand-600">
                                <Clock className="w-4 h-4" /> {formatTimeRemaining(item.endTime)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Link to={`/item/${item._id}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg active:scale-95">
                            <Eye className="w-4 h-4" /> Inspect
                          </Link>
                          <button onClick={() => handleDelete(item._id)} disabled={deleting === item._id} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 active:scale-95">
                            {deleting === item._id ? '...' : <><Trash2 className="w-4 h-4" /> Erase</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 bg-white p-4 w-fit mx-auto rounded-[2rem] shadow-sm border border-slate-100">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-4">Sector {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}

            {items.length === 0 && (
              <div className="p-20 text-center text-slate-400 bg-white rounded-[2rem] shadow-sm border border-slate-100 max-w-2xl mx-auto">
                <Package className="w-16 h-16 mx-auto opacity-20 mb-6" />
                <p className="text-xl font-black text-slate-900 mb-2">Inventory Depleted</p>
                <p className="font-medium text-slate-500">No assets detected with the current telemetry configuration.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default AdminItems;