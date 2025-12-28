const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  basePrice: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  auctionDuration: { type: Number, required: true }, // in hours
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'sold', 'closed', 'expired'], 
    default: 'active' 
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
});

// Virtual for checking if auction is active
itemSchema.virtual('isActive').get(function() {
  return this.endTime > new Date() && this.status === 'active';
});

// Virtual for time remaining
itemSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endTime);
  const diff = end - now;
  
  if (diff <= 0) return 0;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, total: diff };
});

// Method to update auction status
itemSchema.methods.updateStatus = async function() {
  const now = new Date();
  if (this.endTime <= now && this.status === 'active') {
    this.status = 'expired';
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Item', itemSchema); 