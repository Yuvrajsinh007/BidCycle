import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Star, User, Package, Calendar } from 'lucide-react';
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
      await api.post('/users/reviews', { targetUserId: id, rating, comment });
      setMsg('Review added successfully!');
      setComment('');
      fetchProfile(); // Refresh
    } catch (error) {
      setMsg(error.response?.data?.message || 'Failed to add review');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (!profile) return <div className="p-10 text-center">User not found</div>;

  const { seller, items, reviews, stats } = profile;

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
           
           {/* Stats */}
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

              {/* Review Form */}
              {user && user._id !== id && (
                 <form onSubmit={handleReview} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold mb-3">Rate this Seller</h3>
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
                    <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">Submit Review</button>
                 </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                 {reviews.map(review => (
                    <div key={review._id} className="bg-white p-4 rounded-xl border border-gray-100">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold text-sm">{review.author.name}</div>
                          <div className="flex text-yellow-400">
                             {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                          </div>
                       </div>
                       <p className="text-gray-600 text-sm">{review.comment}</p>
                       <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;