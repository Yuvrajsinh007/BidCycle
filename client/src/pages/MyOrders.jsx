import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Package, ShoppingBag, Eye, Calendar, Clock, 
  CheckCircle2, Truck, Check, AlertCircle 
} from 'lucide-react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/my-orders');
      setOrders(data);
    } catch (e) {
      setError('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'pending': { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Processing' },
      'confirmed': { icon: CheckCircle2, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Confirmed' },
      'shipped': { icon: Truck, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', label: 'Shipped' },
      'delivered': { icon: Check, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Delivered' },
      'cancelled': { icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Cancelled' }
    };
    
    const conf = config[status] || config.pending;
    const Icon = conf.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}>
        <Icon className="w-3.5 h-3.5" /> {conf.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900"></div>
           <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-brand-600" /> My Orders
            </h1>
            <p className="text-slate-500 font-medium mt-2">Track the status of your direct purchases.</p>
          </div>
          <Link to="/market" className="bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center">
            Continue Shopping
          </Link>
        </div>

        {error && <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex font-bold text-red-700"><AlertCircle className="w-5 h-5 mr-3"/> {error}</div>}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-dashed border-slate-300 p-16 text-center">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">You haven't made any direct purchases yet. Browse the marketplace to find items you love.</p>
            <Link to="/market" className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg">
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-black border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Item Detail</th>
                    <th className="px-8 py-5">Order Date</th>
                    <th className="px-8 py-5">Total</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex-shrink-0 border border-slate-200">
                            {order.item?.images?.[0] ? (
                              <img src={order.item.images[0]} alt={order.item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Package className="w-6 h-6"/></div>
                            )}
                          </div>
                          <div>
                            {order.item ? (
                              <Link to={`/item/${order.item._id}`} className="text-lg font-black text-slate-900 hover:text-brand-600 transition-colors">
                                {order.item.title}
                              </Link>
                            ) : (
                              <p className="text-lg font-black text-slate-400 italic">Item Removed</p>
                            )}
                            <p className="text-sm font-bold text-slate-500 mt-1">Qty: {order.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-xl font-black text-slate-900">₹{order.total.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">₹{order.price.toLocaleString()} / item</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {getStatusBadge(order.status)}
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

export default MyOrders;
