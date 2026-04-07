import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, CheckCircle, Ban, Search, User, FileText
} from 'lucide-react';

const AdminKyc = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/kyc?status=${statusFilter}`);
      setRequests(data);
    } catch (e) { 
      setError('Failed to load KYC requests'); 
    } 
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      setUpdating(userId);
      await api.put(`/admin/kyc/${userId}`, { status: newStatus });
      setRequests(requests.filter(r => r._id !== userId));
    } catch (e) { 
      alert('Failed to update KYC status'); 
    } 
    finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <div className="p-3 bg-brand-50 rounded-2xl"><ShieldCheck className="w-8 h-8 text-brand-600" /></div>
               KYC Approvals
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Verify seller identities and manage platform trust.</p>
          </div>
          
          <div className="bg-white p-2 rounded-xl flex gap-2 border border-slate-200 shadow-sm">
             {['pending', 'approved', 'rejected'].map(s => (
               <button
                 key={s}
                 onClick={() => setStatusFilter(s)}
                 className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                   statusFilter === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                 }`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-[1.5rem] flex items-center gap-3 font-bold shadow-sm">
            <Ban className="w-6 h-6" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc Type</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map(req => (
                    <tr key={req._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm shrink-0">
                            {req.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{req.name}</p>
                            <p className="text-xs text-slate-500">{req.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-700 capitalize">
                        {req.kycDocType || 'Unknown'}
                      </td>
                      <td className="px-8 py-5">
                        <a href={req.kycDocUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 font-bold hover:text-brand-800 transition-colors text-sm">
                           <FileText className="w-4 h-4" /> View Doc
                        </a>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {statusFilter === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                               onClick={() => handleUpdateStatus(req._id, 'approved')}
                               disabled={updating === req._id}
                               className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                               <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button
                               onClick={() => handleUpdateStatus(req._id, 'rejected')}
                               disabled={updating === req._id}
                               className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                               <Ban className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg ${
                            statusFilter === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                             {statusFilter}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {requests.length === 0 && (
                <div className="p-16 text-center text-slate-400">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-bold">No {statusFilter} KYC requests.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKyc;
