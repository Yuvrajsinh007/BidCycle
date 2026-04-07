const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['outbid', 'watchlist_ending', 'new_item', 'system'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
