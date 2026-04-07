import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      setCartItems(cartItems.filter(item => item.item._id !== itemId));
    } catch (error) {
      console.error('Remove item failed:', error);
    }
  };

  const updateQuantity = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    try {
      await api.put(`/cart/${itemId}`, { quantity: newQty });
      setCartItems(cartItems.map(item => 
        item.item._id === itemId ? { ...item, quantity: newQty } : item
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Direct checkout bypasses Razorpay for direct cart checkouts in development
      const { data } = await api.post('/orders/checkout');
      alert(data.message);
      navigate('/my-orders');
    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-slate-50 flex justify-center items-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const tax = subtotal * 0.05; // 5% example tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
             <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
             <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
             <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added any items to your cart yet. Discover amazing deals in our marketplace.</p>
             <Link to="/market" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                Continue Shopping <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="flex-1 space-y-4">
               {cartItems.map((cartItem) => {
                 const { item, quantity } = cartItem;
                 return (
                   <div key={item._id} className="bg-white rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                     <div className="w-32 h-32 shrink-0 bg-slate-100 rounded-xl overflow-hidden self-start sm:self-auto">
                        <img src={item.images?.[0] || 'https://placehold.co/400'} alt={item.title} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 w-full flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1">
                           <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                           <p className="text-sm text-slate-500 flex items-center gap-1.5">
                              Status: {item.stock > 0 ? <span className="text-green-600 font-semibold">{item.stock} in stock</span> : <span className="text-red-500 font-semibold">Out of stock</span>}
                           </p>
                           <p className="text-xl font-extrabold text-slate-900 mt-2">₹{item.price.toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                             <button onClick={() => updateQuantity(item._id, quantity, -1)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                             <span className="w-10 text-center font-bold text-sm select-none">{quantity}</span>
                             <button disabled={quantity >= item.stock} onClick={() => updateQuantity(item._id, quantity, 1)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-4 h-4" /></button>
                           </div>
                           <button onClick={() => removeItem(item._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 mt-auto">
                             <Trash2 className="w-4 h-4" /> <span className="text-sm font-semibold sm:hidden">Remove</span>
                           </button>
                        </div>
                     </div>
                   </div>
                 );
               })}
            </div>

            {/* Order Summary sidebar */}
            <div className="w-full lg:w-96 shrink-0">
               <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm sticky top-28">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6 text-sm">
                     <div className="flex justify-between text-slate-600 font-medium">
                        <span>Subtotal ({cartItems.length} items)</span>
                        <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-slate-600 font-medium">
                        <span>Platform Fee (5%)</span>
                        <span className="text-slate-900">₹{tax.toLocaleString()}</span>
                     </div>
                     <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-brand-600">₹{total.toLocaleString()}</span>
                     </div>
                  </div>

                  <button 
                    onClick={handleCheckout} 
                    disabled={processing || cartItems.some(c => c.item.stock < c.quantity)}
                    className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Checkout securely <ShieldCheck className="w-5 h-5" /></>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center justify-center gap-1.5">
                     <ShieldCheck className="w-3.5 h-3.5" /> Payments are secure and encrypted.
                  </p>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;
