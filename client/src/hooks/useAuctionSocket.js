import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
  transports: ['websocket']
});

export function useAuctionSocket(itemId, callbacks) {
  useEffect(() => {
    if (!itemId) return;

    // Join the specific item's socket room
    socket.emit('join_item', itemId);

    // Dynamic handlers wrapping the passed callbacks
    const handleBidUpdate = (data) => {
      if (data.itemId === itemId && callbacks.onBidUpdate) {
        callbacks.onBidUpdate(data);
      }
    };

    const handleAuctionEnd = (data) => {
      if (data.itemId === itemId && callbacks.onAuctionEnd) {
        callbacks.onAuctionEnd(data);
      }
    };

    const handleAuctionStart = (data) => {
      if (data.itemId === itemId && callbacks.onAuctionStart) {
        callbacks.onAuctionStart(data);
      }
    };

    const handleAuctionExtended = (data) => {
      if (data.itemId === itemId && callbacks.onAuctionExtended) {
        callbacks.onAuctionExtended(data);
      }
    };

    socket.on('bid_update', handleBidUpdate);
    socket.on('auction_ended', handleAuctionEnd);
    socket.on('auction_started', handleAuctionStart);
    socket.on('auction_extended', handleAuctionExtended);

    return () => {
      socket.off('bid_update', handleBidUpdate);
      socket.off('auction_ended', handleAuctionEnd);
      socket.off('auction_started', handleAuctionStart);
      socket.off('auction_extended', handleAuctionExtended);
    };
  }, [itemId, callbacks]);

  return socket;
}
