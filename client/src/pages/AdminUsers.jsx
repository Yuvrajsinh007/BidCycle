import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import debounce from '../utils/debounce';
import { 
  Search, User, Shield, Ban, CheckCircle, ChevronLeft, ChevronRight, Mail, Calendar, ActivitySquare
} from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(null);

  const debouncedUpdate = useCallback(
    debounce((value) => { setSearch(value); setCurrentPage(1); }, 500), []
  );

  const handleInputChange = (e) => {
    const value = e.target.value; setInputValue(value); debouncedUpdate(value);
  };

  useEffect(() => { fetchUsers(); }, [currentPage, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users?page=${currentPage}&search=${search}`);
      setUsers(data.users); setTotalPages(data.pagination.total);
    } catch (e) { setError('Failed to load users'); } 
    finally { setLoading(false); }
  };

  const handleBanToggle = async (userId) => {
    try {
      setUpdating(userId);
      await api.put(`/admin/users/${userId}/ban`);
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !u.isBanned } : u));
    } catch (e) { alert('Failed to update status'); } 
    finally { setUpdating(null); }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      setUpdating(userId);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (e) { alert('Failed to update role'); } 
    finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <div className="p-3 bg-blue-50 rounded-2xl"><User className="w-8 h-8 text-blue-600" /></div>
               User Directory
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Manage identities, roles, and platform access.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 font-bold shadow-sm">
            <Ban className="w-6 h-6" /> {error}
          </div>
        )}

        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Query by name or email identity..."
              value={inputValue}
              onChange={handleInputChange}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingress Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base">{user.name}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {user.role === 'Admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-600 border border-brand-100 shadow-sm">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <div className="relative">
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                                disabled={updating === user._id}
                                className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer hover:border-blue-400 disabled:opacity-50 transition-all appearance-none"
                            >
                                <option value="Buyer">Buyer</option>
                                <option value="Seller">Seller</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          user.isBanned ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {user.isBanned ? <><Ban className="w-3 h-3" /> Banned</> : <><CheckCircle className="w-3 h-3" /> Active</>}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right flex justify-end">
                        <button
                          onClick={() => handleBanToggle(user._id)}
                          disabled={updating === user._id || user.role === 'Admin'}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                            user.isBanned ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updating === user._id ? 'Processing...' : user.isBanned ? 'Restore Access' : 'Revoke Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="p-16 text-center text-slate-400">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-bold">No identities match this query.</p>
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
export default AdminUsers;