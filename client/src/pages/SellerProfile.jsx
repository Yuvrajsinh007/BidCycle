import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
// Added Edit2 and Trash2 icons
import { Star, User, Package, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SellerProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');
  
  // New State for Editing
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/profile/${id}`);
      setProfile(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReviewId) {
        // Update existing review
        await api.put(`/users/reviews/${editingReviewId}`, { rating, comment });
        setMsg('Review updated successfully!');
      } else {
        // Create new review
        await api.post('/users/reviews', { targetUserId: id, rating, comment });
        setMsg('Review added successfully!');
      }
      
      // Reset form
      setComment('');
      setRating(5);
      setEditingReviewId(null);
      fetchProfile(); // Refresh list
    } catch (error) {
      setMsg(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review._id);
    setRating(review.rating);
    setComment(review.comment);
    setMsg('');
    // Scroll to form (optional UX improvement)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.delete(`/users/reviews/${reviewId}`);
      fetchProfile();
      setMsg('Review deleted successfully');
    } catch (error) {
      console.error(error);
      setMsg('Failed to delete review');
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(5);
    setComment('');
    setMsg('');
  };

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (!profile) return <div className="p-10 text-center">User not found</div>;

  const { seller, items, reviews, stats } = profile;

  // --- SORTING LOGIC START ---
  // Sort reviews: Current user's review first, then chronological
  const sortedReviews = [...reviews].sort((a, b) => {
    if (!user) return 0;
    const isMyReviewA = a.author._id === user._id;
    const isMyReviewB = b.author._id === user._id;
    
    if (isMyReviewA && !isMyReviewB) return -1; // Move A to top
    if (!isMyReviewA && isMyReviewB) return 1;  // Move B to top
    return 0; // Keep original order
  });
  // --- SORTING LOGIC END ---

  // Check if current user has already reviewed (to hide/show form logic)
  const userHasReviewed = user && reviews.some(r => r.author._id === user._id);
  // Show form if user hasn't reviewed OR if they are currently editing their review
  const showReviewForm = user && user._id !== id && (!userHasReviewed || editingReviewId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-6">
           <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
              {seller.name.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
              <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                 <Calendar className="w-4 h-4" /> Member since {new Date(seller.createdAt).toLocaleDateString()}
              </p>
           </div>
           
           <div className="flex gap-8 border-l pl-8">
              <div className="text-center">
                 <p className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-1">
                    {stats.avgRating} <Star className="w-5 h-5 text-yellow-400 fill-current" />
                 </p>
                 <p className="text-sm text-gray-500">{stats.totalReviews} Reviews</p>
              </div>
              <div className="text-center">
                 <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
                 <p className="text-sm text-gray-500">Active Items</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* LEFT: Active Listings */}
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Package className="w-5 h-5" /> Active Listings
              </h2>
              {items.length === 0 ? (
                 <p className="text-gray-500 italic">No active items.</p>
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map(item => (
                       <Link key={item._id} to={`/item/${item._id}`} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition">
                          <img src={item.images[0]} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                          <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-indigo-600 font-bold">${item.currentBid || item.basePrice}</p>
                       </Link>
                    ))}
                 </div>
              )}
           </div>

           {/* RIGHT: Reviews */}
           <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Star className="w-5 h-5" /> Reviews
              </h2>

              {/* Review Form - Conditionally Rendered */}
              {showReviewForm && (
                 <form onSubmit={handleReview} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all">
                    <h3 className="font-semibold mb-3">
                        {editingReviewId ? 'Edit Your Review' : 'Rate this Seller'}
                    </h3>
                    
                    {msg && <p className="text-sm text-indigo-600 mb-2">{msg}</p>}
                    
                    <div className="flex gap-2 mb-3">
                       {[1,2,3,4,5].map(num => (
                          <button key={num} type="button" onClick={() => setRating(num)}>
                             <Star className={`w-6 h-6 ${num <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          </button>
                       ))}
                    </div>
                    
                    <textarea 
                       className="w-full p-2 border rounded-lg text-sm mb-2" 
                       placeholder="Write a review..." 
                       value={comment}
                       onChange={e => setComment(e.target.value)}
                       required
                    />
                    
                    <div className="flex gap-2">
                        <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">
                            {editingReviewId ? 'Update Review' : 'Submit Review'}
                        </button>
                        {editingReviewId && (
                            <button 
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                 </form>
              )}

              {/* Reviews List - Using sortedReviews */}
              <div className="space-y-4">
                 {sortedReviews.map(review => {
                    const isMyReview = user && review.author._id === user._id;
                    
                    return (
                        <div key={review._id} className={`bg-white p-4 rounded-xl border ${isMyReview ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100'}`}>
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                  <div className="font-semibold text-sm">{review.author.name}</div>
                                  <div className="flex text-yellow-400">
                                     {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                  </div>
                              </div>
                              
                              {/* Edit/Delete Actions for Owner */}
                              {isMyReview && (
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleEditClick(review)} 
                                        className="text-gray-400 hover:text-indigo-600 p-1"
                                        title="Edit Review"
                                      >
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteClick(review._id)} 
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="Delete Review"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              )}
                           </div>
                           
                           <p className="text-gray-600 text-sm">{review.comment}</p>
                           <p className="text-xs text-gray-400 mt-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                           </p>
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