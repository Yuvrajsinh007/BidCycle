import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { useAuctionSocket } from "../hooks/useAuctionSocket";
import { useTimer } from "../hooks/useTimer";
import AuctionTimer from "../components/ui/AuctionTimer";
import { 
  IndianRupee, User, Tag, AlertCircle, CheckCircle2,
  Trophy, Gavel, History, Info,
  Heart, MessageCircle, ChevronRight, Share2
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
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Timer hook
  const timerData = useTimer(
    item?.launchTime || item?.createdAt, 
    item?.endTime, 
    item?.status
  );

  const fetchItemDetails = useCallback(async () => {
    try {
      const [itemResponse, bidsResponse] = await Promise.all([
        api.get(`/items/${id}`),
        api.get(`/items/${id}/bids`),
      ]);
      setItem(itemResponse.data);
      setBids(bidsResponse.data);
    } catch (err) {
      console.error("Error fetching details:", err);
      setError("Failed to load item specifics.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItemDetails();

    if (user) {
      api.get('/users/watchlist').then(res => {
        setIsInWatchlist(!!res.data.find(i => i._id === id));
      }).catch(err => console.error(err));
    }
  }, [user, id, fetchItemDetails]);

  // Socket Hook Implementation
  useAuctionSocket(id, {
    onBidUpdate: (data) => {
      // FIX: Instead of manually building a fake bid object, fetch the real, up-to-date data from the DB!
      // This guarantees all users see the exact same history, no matter what.
      fetchItemDetails(); 
    },
    onAuctionEnd: (data) => {
      setItem(prev => prev ? { ...prev, status: data.status, winner: data.winner } : prev);
      fetchItemDetails(); 
    }
  });

  const handleToggleWatchlist = async () => {
    if (!user) return navigate('/login');
    try {
        const res = await api.post('/users/watchlist', { itemId: item._id });
        setIsInWatchlist(res.data.isAdded);
    } catch (err) {
        console.error('Failed to update watchlist');
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!user) return navigate("/login");
    if (timerData.isUpcoming) return setError("Auction hasn't started.");
    
    const amount = parseFloat(bidAmount);
    const minBid = (item.currentBid || item.basePrice) + 1;
    
    if (!amount || amount < minBid) return setError(`Minimum bid is ₹${minBid}`);

    try {
      setSubmitting(true);
      await api.post(`/bids/${id}`, { amount });
      
      setSuccess("Bid successfully placed!");
      setBidAmount("");
      
      // FIX: Re-fetch the true data immediately after our bid goes through to guarantee accuracy
      fetchItemDetails();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place bid.");
    } finally {
      setSubmitting(false);
    }
  };

  // derived state
  const isWinner = timerData.isEnded && user && item?.winner && 
                   (item.winner._id === user._id || item.winner === user._id);
  
  const didUserBid = user && bids.some(b => b.bidder?._id === user._id || b.bidder === user._id);
  const isLoser = timerData.isEnded && didUserBid && !isWinner;
  const isOwner = user && item?.seller?._id === user._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900"></div>
           <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Fetching Details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <div className="text-center p-10 bg-white rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
           <div className="bg-red-50 text-red-500 p-4 rounded-full inline-flex mb-6">
              <AlertCircle className="w-12 h-12" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2">Item Unavailable</h2>
           <p className="text-slate-500 mb-8 font-medium">This auction may have been removed or the link is invalid.</p>
           <button onClick={() => navigate('/')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
             Return to Marketplace
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mini Breadcrumb Nav */}
      <div className="bg-slate-50 border-b border-slate-100 mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
           <button onClick={() => navigate(-1)} className="hover:text-slate-900 transition-colors">Marketplace</button>
           <ChevronRight className="w-4 h-4 opacity-50" />
           <span className="text-slate-400 capitalize">{item.category}</span>
           <ChevronRight className="w-4 h-4 opacity-50" />
           <span className="text-slate-900 truncate max-w-[200px]">{item.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Alerts */}
        {isWinner && (
          <div className="mb-8 bg-brand-50 border border-brand-200 p-6 rounded-2xl flex items-center gap-5 animate-slideUp">
            <div className="p-3 bg-brand-500 text-white rounded-xl shadow-sm shadow-brand-200"><Trophy className="w-8 h-8" /></div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">You Won This Auction!</h3>
              <p className="text-slate-700 font-medium">Your winning bid was <strong className="text-brand-700">₹{item.currentBid}</strong>. The seller will contact you shortly.</p>
            </div>
          </div>
        )}

        {isLoser && (
          <div className="mb-8 bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center gap-5 animate-slideUp">
             <div className="p-3 bg-slate-200 text-slate-600 rounded-xl"><Gavel className="w-8 h-8" /></div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">Auction Closed</h3>
              <p className="text-slate-600 font-medium">Someone else placed a higher bid. Keep exploring the marketplace for similar items.</p>
            </div>
          </div>
        )}

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Image Gallery & Details */}
          <div className="lg:col-span-7 space-y-10">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-[4/3] w-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                {item.images?.length > 0 ? (
                  <img src={item.images[currentImageIndex]} alt={item.title} className="w-full h-full object-contain drop-shadow-sm transition-opacity duration-300" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Tag className="w-16 h-16 mb-4 opacity-20" />
                    <span className="font-bold tracking-widest uppercase">No Image</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {item.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide py-1">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-2" : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Tab */}
            <div className="border-t border-slate-100 pt-10">
               <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                 <Info className="w-6 h-6 text-slate-400" /> About this item
               </h3>
               <div className="text-slate-600 text-lg leading-relaxed whitespace-pre-line font-medium max-w-3xl">
                 {item.description}
               </div>

               {/* Seller Info Block */}
               <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                        <User className="w-6 h-6" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-0.5">Listed By</p>
                       <Link to={`/seller/${item.seller?._id}`} className="text-lg font-bold text-slate-900 hover:text-brand-600 transition-colors">
                          {item.seller?.name || 'Unknown Seller'}
                       </Link>
                     </div>
                  </div>
                  {isOwner ? (
                      <div className="flex items-center gap-3">
                         <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Your Item</span>
                         {timerData.isEnded && item.winner && (
                             <button onClick={() => navigate(`/chat/${item._id}`)} title="Contact Winner" className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-brand-600 rounded-full shadow-sm hover:shadow-md transition-all">
                               <MessageCircle className="w-5 h-5" />
                             </button>
                         )}
                      </div>
                  ) : timerData.isEnded && isWinner && (
                      <button onClick={() => navigate(`/chat/${item._id}`)} title="Contact Seller" className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-brand-600 rounded-full shadow-sm hover:shadow-md transition-all">
                         <MessageCircle className="w-5 h-5" />
                      </button>
                  )}
               </div>
            </div>
          </div>

          {/* RIGHT: Sticky Bidding Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-slate-200/50 border border-slate-100">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-full">
                  {item.category}
                </span>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-400 transition-all">
                     <Share2 className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={handleToggleWatchlist}
                      title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                      className={`p-2.5 rounded-full border transition-all ${
                          isInWatchlist ? "bg-red-50 border-red-100 text-red-500" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                  >
                      <Heart className={`w-5 h-5 ${isInWatchlist ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-8">
                {item.title}
              </h1>

              {/* Price & Timer Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                       {timerData.isUpcoming ? "Opening Bid" : "Current Bid"}
                   </p>
                   <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black text-slate-900">
                           ₹{item.currentBid || item.basePrice}
                       </span>
                   </div>
                   {item.currentBid > item.basePrice && (
                       <p className="text-sm font-semibold text-slate-400 mt-1 line-through">Base: ₹{item.basePrice}</p>
                   )}
                </div>

                <div className={`p-5 rounded-2xl border ${
                   timerData.isEnded ? "bg-slate-100 border-slate-200" : "bg-brand-50 border-brand-100"
                }`}>
                   <AuctionTimer item={item} className="text-xl mt-2" />
                </div>
              </div>

              {/* Action Area */}
              <div className="mb-8">
                 {timerData.isUpcoming ? (
                     <div className="text-center py-6 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                         <p className="font-bold text-slate-900 mb-1">Auction Not Started</p>
                         <p className="text-sm text-slate-500 font-medium">Add to watchlist to be notified when it begins.</p>
                     </div>
                 ) : timerData.isEnded ? (
                     <div className="text-center py-6 px-4 bg-slate-50 border border-slate-100 rounded-2xl">
                         <Gavel className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                         <p className="font-bold text-slate-900 mb-1">Auction Closed</p>
                         <p className="text-sm text-slate-500 font-medium">
                            {item.winner ? `Won by ${item.winner.name || 'Anonymous'}` : 'No bids placed.'}
                         </p>
                     </div>
                 ) : !user ? (
                     <button onClick={() => navigate("/login")} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200">
                         Sign in to Bid
                     </button>
                 ) : isOwner ? (
                     <div className="text-center py-6 px-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
                         <p className="font-bold text-brand-600">Your Active Listing</p>
                     </div>
                 ) : user.role !== 'Buyer' ? (
                     <div className="text-center py-4 px-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm">
                         Only Buyer accounts can place bids.
                     </div>
                 ) : (
                     <form onSubmit={handleBid} className="space-y-4">
                         {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {error}</div>}
                         {success && <div className="p-3 bg-brand-50 text-brand-700 text-sm font-bold rounded-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> {success}</div>}
                         
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                               <IndianRupee className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                               type="number"
                               value={bidAmount}
                               onChange={(e) => setBidAmount(e.target.value)}
                               min={(item.currentBid || item.basePrice) + 1}
                               required
                               disabled={submitting}
                               placeholder={`Min. ₹${(item.currentBid || item.basePrice) + 1}`}
                               className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                            />
                         </div>
                         <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white font-black text-lg rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:scale-100 transform active:scale-[0.98] flex items-center justify-center gap-2"
                         >
                            {submitting ? <span className="animate-pulse">Placing Bid...</span> : "Place Bid"}
                         </button>
                         <p className="text-xs font-semibold text-center text-slate-400 uppercase tracking-widest pt-2">Proxy Bidding Active</p>
                     </form>
                 )}
              </div>

              {/* Bid History Accordion / List */}
              <div className="border-t border-slate-100 pt-8 mt-2">
                 <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                   <History className="w-5 h-5 text-slate-400" /> Bid History ({bids.length})
                 </h4>
                 
                 {bids.length === 0 ? (
                    <p className="text-slate-400 font-medium text-sm text-center py-4">Be the first to bid!</p>
                 ) : (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                       {bids.map((bid, i) => (
                           <div key={bid._id} className={`flex items-center justify-between p-3 rounded-xl border ${i === 0 ? 'bg-brand-50 border-brand-100' : 'bg-white border-slate-100'}`}>
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i===0 ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                     {bid.bidder?.name?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-900">
                                         {bid.bidder?.name === user?.name ? 'You' : bid.bidder?.name}
                                         {i === 0 && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-black uppercase">Lead</span>}
                                     </p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(bid.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                               </div>
                               <span className="font-black text-slate-900">₹{bid.amount}</span>
                           </div>
                       ))}
                    </div>
                 )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ItemDetail;