const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String }, // Can be empty if sending only a file
  
  // --- NEW FIELDS ---
  type: { 
    type: String, 
    enum: ['text', 'image', 'video', 'document', 'location'], 
    default: 'text' 
  },
  mediaUrl: { type: String }, // For files
  location: {
    lat: Number,
    lng: Number
  },
  // ------------------
  
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);