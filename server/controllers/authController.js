const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// REMOVED: const nodemailer = require('nodemailer');
const PasswordResetToken = require('../models/PasswordResetToken');
const crypto = require('crypto');
const { sendOtpEmail, generateOTP } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, bio } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Buyer',
      phone,
      address,
      bio,
      isVerified: false,
      otp: otp,
      otpExpiry: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    if (user) {
      const emailResult = await sendOtpEmail(user.email, otp, false);
      if (!emailResult.success) {
        console.error('Failed to send verification email during registration:', emailResult.error);
        // We still successfully registered them, but email failed to send. They can resend it.
      }

      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        requiresVerification: true,
        email: user.email
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email first', 
        requiresVerification: true, 
        email: user.email 
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      isBanned: user.isBanned,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been suspended' });
      }
      
      // Link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = sub;
      }
      
      // Automatically verify if they log in via Google
      if (!user.isVerified) {
        user.isVerified = true;
      }
      
      await user.save();

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        isBanned: user.isBanned,
        profilePic: user.profilePic,
        token: generateToken(user._id),
      });
    } else {
      // NEW USER: Return info so frontend can ask for Role
      return res.json({
        isNewUser: true,
        profile: { name, email, picture }
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// Google Signup (Complete Registration)
exports.googleSignup = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!['Buyer', 'Seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    // Create new user with selected role
    user = await User.create({
      name,
      email,
      profilePic: picture,
      googleId: sub,
      isVerified: true,
      role: role
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBanned: user.isBanned,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google signup error:', error);
    res.status(401).json({ message: 'Authentication failed. Please try again.' });
  }
};

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     if (user.isBanned) {
//       return res.status(403).json({ message: 'Your account has been suspended' });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({ 
//         message: 'Please verify your email first', 
//         requiresVerification: true, 
//         email: user.email 
//       });
//     }

//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       phone: user.phone,
//       address: user.address,
//       bio: user.bio,
//       isBanned: user.isBanned,
//       profilePic: user.profilePic,
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (bio) user.bio = bio;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      profilePic: user.profilePic,
      isBanned: user.isBanned,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile picture
exports.uploadProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    user.profilePic = req.file.path;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePic: user.profilePic
    });
  } catch (error) {
    console.error('Upload profile pic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate Tokens
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const otp = generateOTP();

    // Delete any existing reset tokens for this user before creating a new one
    await PasswordResetToken.deleteMany({ user: user._id });

    // Save reset token with OTP
    await PasswordResetToken.create({
      user: user._id,
      token: hashedToken,
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // UPDATED: Send OTP via Brevo Service
    const emailResult = await sendOtpEmail(user.email, otp, true);

    if (!emailResult.success) {
      // If email fails, we might want to cleanup the token or just log error
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }
    
    res.json({ 
      message: 'Password reset OTP sent to your email',
      token: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Reset OTP
exports.verifyResetOtp = async (req, res) => {
  try {
    const { token, otp } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!resetToken) return res.status(400).json({ message: 'Invalid or expired session' });
    if (resetToken.otp !== otp) return res.status(400).json({ message: 'Invalid OTP code' });

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Verify reset otp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, otp, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (resetToken.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    const user = await User.findById(resetToken.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();

    await PasswordResetToken.findByIdAndDelete(resetToken._id);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP code' });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      isBanned: user.isBanned,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend Verification OTP
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailResult = await sendOtpEmail(user.email, otp, false);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};