import React from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, User, Tag, ShoppingBag, Gavel, Package } from 'lucide-react';
import AuctionTimer from './AuctionTimer';

const statusConfig = {
  upcoming: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Upcoming'
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Live'
  },
  available: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Available'
  },
  out_of_stock: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
    label: 'Out of Stock'
  },
  ended: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    label: 'Ended'
  }
};

const AuctionCard = ({ item }) => {
  const isDirect = item.listingType === 'direct';
  
  // Compute display status
  let currentStatus;
  if (isDirect) {
    currentStatus = (item.status === 'out_of_stock' || item.stock === 0) ? 'out_of_stock' : 'available';
  } else {
    currentStatus = ['sold', 'closed', 'expired', 'paid'].includes(item.status) ? 'ended' : item.status;
  }
  
  const conf = statusConfig[currentStatus] || statusConfig.active;

  return (
    <Link 
      to={`/item/${item._id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col h-full animate-fadeIn"
    >
      {/* Image Container */}
      <div className="relative h-56 bg-slate-50 overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-500 ease-in-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
             <Tag className="w-8 h-8 mb-2 opacity-30" />
             <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {/* Listing Type Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${
            isDirect 
              ? 'bg-amber-100/90 text-amber-800 border-amber-200' 
              : 'bg-indigo-100/90 text-indigo-700 border-indigo-200'
          }`}>
            {isDirect ? <><ShoppingBag className="w-3 h-3" /> Buy Now</> : <><Gavel className="w-3 h-3" /> Auction</>}
          </span>
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${conf.bg} ${conf.text} ${conf.border}`}>
            {conf.label}
          </span>
        </div>
        
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-slate-100 uppercase tracking-wide">
          {item.category}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex justify-between items-end border-t border-slate-100 pt-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                {isDirect ? 'Price' : (currentStatus === 'upcoming' ? 'Starting Bid' : 'Current Bid')}
              </p>
              <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xl">
                <IndianRupee className="w-4 h-4 text-slate-400" strokeWidth={3} />
                {isDirect ? item.price : (item.currentBid || item.basePrice)}
              </div>
            </div>
            <div className="text-right flex flex-col justify-end items-end h-full">
              {isDirect ? (
                <span className={`text-sm font-bold ${item.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                </span>
              ) : (
                <AuctionTimer item={item} className="text-sm" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <User className="w-3 h-3 text-slate-400" />
              </div>
              <span className="truncate max-w-[120px] font-medium">{item.seller?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;
