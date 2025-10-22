const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  // My Suggestion: Add wishlist here!
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // We will create a 'Product' model later
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
