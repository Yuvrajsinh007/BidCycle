import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { 
  Clock, 
  DollarSign, 
  User, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Trophy, 
  Gavel, 
  ArrowLeft,
  ShieldAlert,
  History,
  Info,
  Calendar
} from 'lucide-react';

const ItemDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [, setTick] = useState(0); // State to force re-render every second

  useEffect(() => {
    fetchItemDetails();
    
    // Live Timer Interval
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      // Don't set loading true on background refreshes if data exists
      if (!item) setLoading(true); 
      
      const [itemResponse, bidsResponse] = await Promise.all([
        api.get(`/items/${id}`),
        api.get(`/items/${id}/bids`),
      ]);

      setItem(itemResponse.data);
      setBids(bidsResponse.data);
    } catch (error) {
      console.error("Error fetching item details:", error);
      setError("Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (item.status === 'upcoming') {
        setError("Auction has not started yet.");
        return;
    }

    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    const currentPrice = item.currentBid || item.basePrice;
    if (amount <= currentPrice) {
      setError(`Bid must be higher than $${currentPrice}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/bids/${id}`, { amount });
      setSuccess(response.data.message || "Bid placed successfully!");
      setBidAmount("");
      fetchItemDetails(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  };

  // Logic for Status
  const isUpcoming = item && item.status === 'upcoming';
  const isAuctionEnded = item && (new Date(item.endTime) < new Date() || item.status === 'sold' || item.status === 'expired' || item.status === 'closed');
  const isAuctionActive = item && item.status === 'active' && !isAuctionEnded && !isUpcoming;

  // Logic for winning/losing
  const didUserBid = user && bids.some(bid => bid.bidder._id === user._id || bid.bidder === user._id);
  const isWinner = user && item?.winner && (item.winner._id === user._id || item.winner === user._id);
  const isLoser = isAuctionEnded && didUserBid && !isWinner;

  // Unified Timer Function
  const formatTimer = () => {
    if (!item) return "";
    const now = new Date();
    
    // If upcoming, count down to Start Time. Else, count to End Time.
    const targetDate = isUpcoming ? new Date(item.startTime) : new Date(item.endTime);
    const diff = targetDate - now;

    if (diff <= 0) {
        return isUpcoming ? "Starting..." : "Auction ended";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
           <p className="text-gray-500 mb-6">The auction you are looking for does not exist or has been removed.</p>
           <button 
             onClick={() => navigate('/')}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
           >
             Go Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Listings
        </button>

        {/* WIN/LOSS ALERTS */}
        {isWinner && (
          <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-2xl flex items-start sm:items-center gap-4 animate-fadeIn">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
               <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-800">Congratulations!</h3>
              <p className="text-green-700">You have won this auction with a bid of <span className="font-bold">${item.currentBid}</span>.</p>
            </div>
          </div>
        )}

        {isLoser && (
          <div className="mb-8 bg-gray-100 border border-gray-300 p-6 rounded-2xl flex items-start sm:items-center gap-4 animate-fadeIn">
             <div className="p-3 bg-gray-200 text-gray-600 rounded-full">
               <Gavel className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Auction Ended</h3>
              <p className="text-gray-600">Unfortunately, you did not win this item. Better luck next time!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN - IMAGES */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 group">
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Status Badge Overlay */}
                  <div className="absolute top-4 right-4">
                      {isUpcoming ? (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/90 text-white backdrop-blur-md shadow-sm">
                            <Calendar className="w-3 h-3" /> Upcoming
                         </span>
                      ) : isAuctionEnded ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-900/80 text-white backdrop-blur-md">
                           Auction Ended
                          </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/90 text-white backdrop-blur-md animate-pulse">
                            <Clock className="w-3 h-3" /> Live Auction
                         </span>
                      )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                  <Tag className="w-16 h-16 mb-2 opacity-50" />
                  <span>No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {item.images && item.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-indigo-600 shadow-md scale-105"
                        : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Description Section for Mobile */}
            <div className="lg:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <Info className="w-5 h-5 text-indigo-600" /> Description
               </h3>
               <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>
          </div>

          {/* RIGHT COLUMN - INFO & ACTIONS */}
          <div className="space-y-6">
            
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                    {item.category}
                 </span>
                 <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.seller?.name || 'Unknown Seller'}
                 </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                {item.title}
              </h1>
            </div>

            {/* Current Status Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex flex-wrap items-end gap-x-8 gap-y-4 mb-6">
                 <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        {isUpcoming ? "Starting Bid" : "Current Price"}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-indigo-600">
                            ${item.currentBid || item.basePrice}
                        </span>
                        {item.currentBid > item.basePrice && (
                             <span className="text-sm text-gray-400 line-through font-medium">
                                Base: ${item.basePrice}
                             </span>
                        )}
                    </div>
                 </div>
                 
                 <div className="pl-6 border-l border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                        {isUpcoming ? "Starts In" : isAuctionEnded ? "Status" : "Ends In"}
                    </p>
                    <div className={`flex items-center gap-2 font-bold text-lg ${
                        isUpcoming ? "text-blue-600" : isAuctionEnded ? "text-red-500" : "text-gray-800"
                    }`}>
                        <Clock className="w-5 h-5" />
                        {formatTimer()}
                    </div>
                 </div>

                 <div className="pl-6 border-l border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Bids</p>
                    <div className="font-bold text-lg text-gray-800">
                        {bids.length}
                    </div>
                 </div>
               </div>

               {/* Bidding Action Area */}
               {isUpcoming ? (
                  <div className="pt-6 border-t border-gray-100">
                     <div className="text-center py-6 bg-blue-50 rounded-xl border border-blue-100">
                         <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                         <h3 className="text-blue-900 font-bold text-lg">Coming Soon</h3>
                         <p className="text-blue-700">
                            This auction is scheduled to start on <br/>
                            <span className="font-semibold text-blue-900">
                                {new Date(item.startTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                            </span>
                         </p>
                     </div>
                  </div>
               ) : isAuctionActive ? (
                 <div className="pt-6 border-t border-gray-100">
                   {!user ? (
                       <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                            <p className="text-gray-600 mb-3 font-medium">Sign in to participate in this auction</p>
                            <button
                               onClick={() => navigate("/login")}
                               className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                           >
                               Login to Bid
                           </button>
                       </div>
                   ) : user.isBanned ? (
                       <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 text-red-700 border border-red-100">
                            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                            <p className="font-medium">Your account is suspended. You cannot place bids.</p>
                       </div>
                   ) : user.role !== 'Buyer' ? (
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 text-gray-600 border border-gray-200">
                            <User className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">Registered as {user.role}. Only Buyer accounts can bid.</p>
                       </div>
                   ) : (
                       <>
                          {error && (
                               <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg flex items-center gap-2">
                                   <AlertCircle className="w-4 h-4" /> {error}
                               </div>
                          )}
                          {success && (
                               <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg flex items-center gap-2">
                                   <CheckCircle2 className="w-4 h-4" /> {success}
                               </div>
                          )}
                          
                          <form onSubmit={handleBid} className="flex flex-col sm:flex-row gap-3">
                               <div className="relative flex-grow">
                                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                       <DollarSign className="h-5 w-5 text-gray-400" />
                                   </div>
                                   <input
                                       type="number"
                                       value={bidAmount}
                                       onChange={(e) => setBidAmount(e.target.value)}
                                       min={item.currentBid ? item.currentBid + 1 : item.basePrice + 1}
                                       step="0.01"
                                       required
                                       disabled={submitting}
                                       placeholder={`Enter $${item.currentBid ? item.currentBid + 1 : item.basePrice + 1} or more`}
                                       className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                   />
                               </div>
                               <button
                                   type="submit"
                                   disabled={submitting}
                                   className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-2"
                               >
                                   {submitting ? (
                                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                   ) : (
                                       <>Place Bid <Gavel className="w-4 h-4" /></>
                                   )}
                               </button>
                          </form>
                          <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
                              By placing a bid, you agree to the auction terms and conditions.
                          </p>
                       </>
                   )}
                 </div>
               ) : null}

               {/* Auction Ended Status */}
               {isAuctionEnded && (
                   <div className="pt-6 border-t border-gray-100 text-center">
                       <h3 className="text-gray-900 font-bold text-lg mb-1">Auction Closed</h3>
                       {item.winner ? (
                           <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg mt-2">
                               <Trophy className="w-4 h-4" />
                               <span className="font-semibold">Winner: {item.winner.name || item.winner}</span>
                           </div>
                       ) : (
                           <p className="text-gray-500">No bids were placed or reserve not met.</p>
                       )}
                   </div>
               )}
            </div>

            {/* Description (Desktop) */}
            <div className="hidden lg:block bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <Info className="w-5 h-5 text-indigo-600" /> Description
               </h3>
               <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" /> Bid History
                    </h3>
                </div>
                
                {bids.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Gavel className="w-10 h-10 mx-auto text-gray-300 mb-2 opacity-50" />
                        <p>No bids yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bidder</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bids.map((bid, index) => (
                                    <tr key={bid._id} className={index === 0 ? "bg-indigo-50/30" : ""}>
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                            {bid.bidder.name === user?.name ? "You" : bid.bidder.name}
                                            {index === 0 && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">Highest</span>}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-bold text-indigo-600">
                                            ${bid.amount}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500 text-right">
                                            {new Date(bid.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;