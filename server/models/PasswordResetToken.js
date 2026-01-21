const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  otp: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);