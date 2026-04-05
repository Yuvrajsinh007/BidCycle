import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const AuctionTimer = ({ item, className = "" }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (['sold', 'closed', 'expired', 'paid'].includes(item.status)) return;
    if (item.endTime && new Date(item.endTime).getTime() <= Date.now()) return;
    
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [item.endTime, item.status]);

  const start = new Date(item.launchTime || item.createdAt).getTime();
  const end = new Date(item.endTime).getTime();
  
  const isUpcoming = now < start;
  const isExpired = now >= end;
  // Dynamic status overrides DB if there's a discrepancy before refresh
  const isEnded = isExpired || ['sold', 'closed', 'expired', 'paid'].includes(item.status);

  let prefix = '';
  let timeText = '';
  let colorClass = '';

  if (isEnded) {
    prefix = '';
    timeText = 'Auction Ended';
    colorClass = 'text-slate-500';
  } else {
    const targetDate = isUpcoming ? start : end;
    const diff = targetDate - now;

    if (diff <= 0) {
      prefix = '';
      timeText = isUpcoming ? 'Starting...' : 'Ending...';
      colorClass = isUpcoming ? 'text-blue-600' : 'text-brand-600';
    } else {
      prefix = isUpcoming ? 'Starts in' : 'Ends in';
      colorClass = isUpcoming ? 'text-blue-600' : 'text-brand-600';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours.toString().padStart(2, '0')}:`);
      parts.push(`${minutes.toString().padStart(2, '0')}:`);
      parts.push(`${seconds.toString().padStart(2, '0')}`);
      
      timeText = parts.join('');
    }
  }

  return (
    <div className={`flex items-center gap-1.5 font-bold ${colorClass} ${className}`}>
      <Clock className="w-4 h-4" strokeWidth={2.5} />
      <span>{prefix ? `${prefix} ` : ''}{timeText}</span>
    </div>
  );
};

export default AuctionTimer;
