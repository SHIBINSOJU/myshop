const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/mailer');

const BRAND_NAME = "Pixelcart"; // Use this for page titles

// --- NEW ---

// Show Signup Page
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up', brandName: BRAND_NAME, error: null });
});

// Handle Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) 
      return res.render('signup', { 
        title: 'Sign Up', 
        brandName: BRAND_NAME,
        error: 'An account with this email already exists.' 
      });
    
    // ----- THIS BRACE WAS REMOVED: } -----

    const newUser = new User({ email });

    // If a password was provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      newUser.passwordHash = await bcrypt.hash(password, salt);
    }
    
    await newUser.save();
    
    // Redirect to login with a success message (optional)
    // Or log them in directly by creating a session/token
    res.redirect('/login');

  } catch (error) {
    console.error(error);
    res.render('signup', {
      title: 'Sign Up',
      brandName: BRAND_NAME,
      error: 'An server error occurred during signup.'
    });
  }
});

// Handle Password Login
router.post('/login/password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.passwordHash) {
      req.session.error = 'Invalid credentials or no password set for this account.';
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      req.session.error = 'Invalid credentials.';
      return res.redirect('/login');
    }

    // --- SUCCESS ---
    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email }, // Removed name, it's not in your schema
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store in HTTP-Only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also create the session for server-side auth
    req.session.userId = user._id;

    res.redirect('/products');

  } catch (error) {
    console.error(error);
    req.session.error = 'An server error occurred.';
    res.redirect('/login');
  }
});


// --- EXISTING ---

// 1. Show Login Page
router.get('/login', (req, res) => {
  // Pass an error message if one exists from a failed attempt
  const error = req.session.error;
  req.session.error = null; // Clear error after showing it
  res.render('login', { title: 'Login', brandName: BRAND_NAME, error });
});

// 2. Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP (Good Practice!)
    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    
    // Set OTP expiry (5 minutes from now)
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); 
    
    await user.save();

    // Send the *plain text* OTP via email
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      req.session.error = "Could not send OTP email. Please try again.";
      return res.redirect('/login');
    }

    // Store email in session to verify on the next page
    req.session.emailForVerification = email;
    
    // Redirect to the /verify page
    res.redirect('/verify');

  } catch (error) {
    console.error(error);
    req.session.error = "An server error occurred.";
    res.redirect('/login');
  }
});

// 3. Show Verify OTP Page
router.get('/verify', (req, res) => {
  const email = req.session.emailForVerification;
  if (!email) {
    // If user lands here directly, send them back
    return res.redirect('/login');
  }

  const error = req.session.error;
  req.session.error = null; // Clear error

  res.render('verify', { 
    title: 'Verify OTP', 
    brandName: BRAND_NAME, 
    email: email,
    error 
  });
});

// 4. Verify OTP and Log In
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.emailForVerification;

    if (!email) {
      req.session.error = "Your session expired. Please try again.";
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });

    // Check 1: User exists?
    if (!user) {
      req.session.error = "User not found. Please start over.";
      return res.redirect('/login');
    }

    // Check 2: OTP exists and not expired?
    if (!user.otp || user.otpExpires < Date.now()) {
      req.session.error = "Your OTP has expired. Please request a new one.";
      return res.redirect('/login');
    }

    // Check 3: Does the OTP match?
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      req.session.error = "Invalid OTP. Please try again.";
      return res.redirect('/verify'); // Stay on verify page
    }

    // --- SUCCESS ---
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Clear temporary email from session
    req.session.emailForVerification = null;

    // Create the secure session!
    req.session.userId = user._id;

    // Redirect to the main products page
    res.redirect('/products');

  } catch (error) {
    console.error(error);
    req.session.error = "An server error occurred.";
    res.redirect('/login');
  }
});

// 5. Logout
router.get('/logout', (req, res) => {
  // Clear the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    }

    // Clear the JWT cookie
    res.clearCookie('token');

    // Clear the session cookie
    res.clearCookie('connect.sid');

    res.redirect('/'); // Redirect to home
  });
});

module.exports = router;
