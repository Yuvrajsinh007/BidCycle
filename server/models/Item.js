const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  
  // --- LISTING TYPE ---
  listingType: { type: String, enum: ['auction', 'direct'], default: 'auction' },
  
  // --- AUCTION FIELDS ---
  basePrice: { type: Number, required: function() { return this.listingType === 'auction'; } },
  currentBid: { type: Number, default: 0 },
  highestMaxBid: { type: Number, default: 0, select: false },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auctionDuration: { type: Number, required: function() { return this.listingType === 'auction'; } },
  launchTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: function() { return this.listingType === 'auction'; } },

  // --- DIRECT SELLING FIELDS ---
  price: { type: Number, required: function() { return this.listingType === 'direct'; } },
  stock: { type: Number, default: 1, min: 0 },

  // --- COMMON FIELDS ---
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'sold', 'closed', 'expired', 'paid', 'available', 'out_of_stock'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now },
});

// Virtual for checking if auction is active
itemSchema.virtual('isActive').get(function() {
  const now = new Date();
  const launch = new Date(this.launchTime || this.createdAt);
  return now >= launch && this.endTime > now && this.status === 'active';
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