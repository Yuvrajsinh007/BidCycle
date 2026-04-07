import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Package, Truck, CheckCircle2, ExternalLink } from 'lucide-react';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/seller-orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your orders.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex justify-center items-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seller Orders</h1>
            <p className="text-slate-500 font-medium mt-1">Manage fulfillment for items you've sold.</p>
          </div>
          <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl">
             Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
             <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-slate-800 mb-2">No Orders Yet</h2>
             <p className="text-slate-500 mb-8 max-w-md mx-auto">You haven't made any sales yet. Make sure your inventory is active and priced well!</p>
             <Link to="/create-item" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md">
                List New Item
             </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4">Order ID & Item</th>
                        <th className="px-6 py-4">Buyer Info</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Status & Fulfillment</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                      <img src={order.item?.images?.[0] || 'https://placehold.co/100'} alt="Item" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 mb-0.5 w-48 truncate" title={order.item?.title}>{order.item?.title || 'Unknown Item'}</p>
                                      <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                      <br/>
                                      <Link to={`/item/${order.item?._id}`} className="text-[10px] font-bold uppercase text-brand-600 hover:text-brand-700 mt-1 inline-flex items-center gap-1">
                                        View Item <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900">{order.buyer?.name || 'Unknown Buyer'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{order.buyer?.email}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm font-black text-slate-900">₹{(order.total || 0).toLocaleString()}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">Qty: {order.quantity}</p>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-max ${
                                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                      order.status === 'shipped' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                      order.status === 'processing' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                      'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                      {order.status === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      {order.status === 'shipped' && <Truck className="w-3.5 h-3.5" />}
                                      {order.status === 'processing' && <Package className="w-3.5 h-3.5" />}
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>
                                  
                                  <div className="flex gap-2">
                                    {order.status === 'pending' || order.status === 'processing' ? (
                                      <button 
                                        disabled={updatingId === order._id}
                                        onClick={() => updateStatus(order._id, 'shipped')}
                                        className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                                      >
                                        Mark Shipped
                                      </button>
                                    ) : null}
                                    
                                    {order.status === 'shipped' ? (
                                      <button 
                                        disabled={updatingId === order._id}
                                        onClick={() => updateStatus(order._id, 'delivered')}
                                        className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                                      >
                                        Mark Delivered
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
