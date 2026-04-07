const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Seller', 'Buyer', 'Admin'],
    default: 'Buyer',
  },
  // --- NEW FIELD ---
  watchlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item' 
  }],
  // ----------------
  // --- KYC & TRUST FIELDS ---
  kycStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'approved', 'rejected'], 
    default: 'unverified' 
  },
  kycDocType: { type: String },
  kycDocUrl: { type: String },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  // -------------------------

  profilePic: { type: String },
  phone: { type: String },
  address: { type: String },
  bio: { type: String },
  isBanned: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }, // email verification
  otp: { type: String },
  otpExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);