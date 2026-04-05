import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate the time difference remaining for auctions.
 * @param {string} launchTime - the start date ISO string
 * @param {string} endTime - the end date ISO string
 * @param {string} status - current status of item ('upcoming', 'active', 'sold', etc)
 * @returns {object} { timeText: string, isUpcoming: boolean, isEnded: boolean }
 */
export function useTimer(launchTime, endTime, status) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Only run the timer if the auction isn't strictly closed
    if (['sold', 'closed'].includes(status)) return;
    
    // Check if it's already past end time
    if (endTime && new Date(endTime) < new Date()) return;
    
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  const start = new Date(launchTime);
  const end = new Date(endTime);
  
  const isUpcoming = now < start;
  const isExpired = now >= end;
  const isEnded = isExpired || ['sold', 'closed', 'expired'].includes(status);

  // Define target date based on whether it has started or not
  const targetDate = isUpcoming ? start : end;
  const diff = targetDate - now;

  let timeText = '';

  if (isEnded) {
    if (status === 'sold') timeText = 'Sold';
    else if (status === 'closed') timeText = 'Closed';
    else timeText = 'Auction Ended';
  } else if (diff <= 0) {
    timeText = isUpcoming ? 'Starting...' : 'Ending...';
  } else {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    timeText = parts.join(' ');
  }

  return { timeText, isUpcoming, isEnded, isActive: !isUpcoming && !isEnded };
}
