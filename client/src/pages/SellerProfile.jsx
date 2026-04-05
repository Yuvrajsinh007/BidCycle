import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Star, User, Package, Calendar, Edit2, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SellerProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/users/profile/${id}`);
      setProfile(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReviewId) {
        await api.put(`/users/reviews/${editingReviewId}`, { rating, comment });
        setMsg('Review updated successfully!');
      } else {
        await api.post('/users/reviews', { targetUserId: id, rating, comment });
        setMsg('Review added successfully!');
      }
      setComment(''); setRating(5); setEditingReviewId(null); fetchProfile();
    } catch (error) { setMsg(error.response?.data?.message || 'Operation failed'); }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review._id); setRating(review.rating); setComment(review.comment); setMsg('');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Erase this review?')) return;
    try {
      await api.delete(`/users/reviews/${reviewId}`);
      fetchProfile(); setMsg('Review deleted');
    } catch (e) { setMsg('Failed to delete review'); }
  };

  const handleCancelEdit = () => { setEditingReviewId(null); setRating(5); setComment(''); setMsg(''); };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"/></div>;
  if (!profile) return <div className="h-screen flex items-center justify-center bg-slate-50 text-2xl font-black text-slate-400">User not found.</div>;

  const { seller, items, reviews, stats } = profile;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (!user) return 0;
    const ia = a.author._id === user._id, ib = b.author._id === user._id;
    if (ia && !ib) return -1;
    if (!ia && ib) return 1;
    return 0;
  });

  const userHasReviewed = user && reviews.some(r => r.author._id === user._id);
  const showReviewForm = user && user._id !== id && (!userHasReviewed || editingReviewId);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
        
        {/* HEADER */}
        <div className="bg-slate-900 rounded-[2rem] shadow-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
           <div className="absolute inset-0 bg-brand-500 opacity-10 blur-3xl rounded-full translate-x-1/2"></div>
           
           <div className="relative">
               <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center text-5xl font-black text-white border-4 border-slate-700 shadow-2xl z-10 relative">
                  {seller.profilePic ? <img src={seller.profilePic} className="w-full h-full object-cover rounded-full" alt="Seller" /> : seller.name.charAt(0).toUpperCase()}
               </div>
               <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-2 rounded-full border-4 border-slate-900 z-20">
                  <ShieldCheck className="w-5 h-5" />
               </div>
           </div>
           
           <div className="flex-1 text-center md:text-left relative z-10">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">{seller.name}</h1>
              <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 font-medium">
                 <Calendar className="w-4 h-4" /> Joined {new Date(seller.createdAt).toLocaleDateString()}
              </p>
           </div>
           
           <div className="flex gap-8 md:border-l md:border-slate-800 md:pl-10 relative z-10 w-full md:w-auto justify-center md:justify-end">
              <div className="text-center bg-slate-800/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700">
                 <p className="text-3xl font-black text-white flex items-center justify-center gap-1 mb-1">
                    {stats.avgRating} <Star className="w-5 h-5 text-yellow-400 fill-current" />
                 </p>
                 <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">{stats.totalReviews} Reviews</p>
              </div>
              <div className="text-center bg-slate-800/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700">
                 <p className="text-3xl font-black text-white mb-1">{stats.totalItems}</p>
                 <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Inventory</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* LEFT: Listings */}
           <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 rounded-xl"><Package className="w-6 h-6 text-brand-600" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Current Catalog</h2>
              </div>

              {items.length === 0 ? (
                 <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Empty Catalog</h3>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                       <Link key={item._id} to={`/item/${item._id}`} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-slate-100">
                             <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <h3 className="font-bold text-slate-900 truncate mb-1 group-hover:text-brand-600 transition-colors">{item.title}</h3>
                          <div className="flex justify-between items-center">
                              <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Current Bid</p>
                              <p className="text-lg font-black text-slate-900">${item.currentBid || item.basePrice}</p>
                          </div>
                       </Link>
                    ))}
                 </div>
              )}
           </div>

           {/* RIGHT: Reviews */}
           <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-50 rounded-xl"><Star className="w-6 h-6 text-yellow-500" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Community</h2>
              </div>

              {showReviewForm && (
                 <form onSubmit={handleReview} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <h3 className="font-black text-lg mb-4 text-slate-900">{editingReviewId ? 'Modify Feedback' : 'Leave Feedback'}</h3>
                    {msg && <p className="text-sm font-bold text-brand-600 bg-brand-50 p-3 rounded-xl mb-4">{msg}</p>}
                    
                    <div className="flex gap-1 mb-6">
                       {[1,2,3,4,5].map(num => (
                          <button key={num} type="button" onClick={() => setRating(num)} className="hover:scale-110 transition-transform">
                             <Star className={`w-8 h-8 ${num <= rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                          </button>
                       ))}
                    </div>
                    
                    <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-medium mb-4 outline-none focus:border-brand-500 focus:bg-white transition-all resize-none" rows="4" placeholder="Detail your transaction experience..." value={comment} onChange={e => setComment(e.target.value)} required />
                    
                    <div className="flex flex-col gap-2">
                        <button className="bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95">{editingReviewId ? 'Save Changes' : 'Post Review'}</button>
                        {editingReviewId && <button type="button" onClick={handleCancelEdit} className="py-4 font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">Cancel Modification</button>}
                    </div>
                 </form>
              )}

              <div className="space-y-4">
                 {sortedReviews.length === 0 && !showReviewForm && (
                     <div className="text-center p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 font-bold text-slate-400">No community feedback yet.</div>
                 )}
                 {sortedReviews.map((review, i) => {
                    const isMyReview = user && review.author._id === user._id;
                    return (
                        <div key={review._id} className={`bg-white p-6 rounded-[2rem] border ${isMyReview ? 'border-brand-100 shadow-md bg-brand-50/20' : 'border-slate-100 shadow-sm'}`}>
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">{review.author.name.charAt(0)}</div>
                                  <div>
                                      <div className="font-bold text-sm text-slate-900">{review.author.name} {isMyReview && <span className="text-[10px] ml-1 bg-brand-500 text-white px-2 py-0.5 rounded-full uppercase">You</span>}</div>
                                      <div className="flex text-yellow-400 mt-0.5">
                                         {[...Array(review.rating)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                                      </div>
                                  </div>
                              </div>
                              
                              {isMyReview && (
                                  <div className="flex gap-1 bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
                                      <button onClick={() => handleEditClick(review)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDeleteClick(review._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              )}
                           </div>
                           <p className="text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                           <p className="text-[10px] uppercase tracking-widest font-black text-slate-300 mt-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;