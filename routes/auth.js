const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/mailer');

const BRAND_NAME = "Pixelcart"; // Use this for page titles

// 1. Show Login/Signup Page
router.get('/login', (req, res) => {
  const error = req.session.error;
  const success = req.session.success;
  req.session.error = null;
  req.session.success = null;
  res.render('login', { title: 'Login', brandName: BRAND_NAME, error, success });
});

// 1b. Handle Email+Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      req.session.error = 'Invalid credentials';
      return res.redirect('/login');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      req.session.error = 'Invalid credentials';
      return res.redirect('/login');
    }
    if (!user.isVerified) {
      // force verification if not completed yet
      req.session.emailForVerification = email;
      req.session.error = 'Please verify your email to continue.';
      return res.redirect('/verify');
    }
    req.session.userId = user._id;
    return res.redirect('/products');
  } catch (e) {
    console.error(e);
    req.session.error = 'Server error';
    return res.redirect('/login');
  }
});

// 1c. Handle Signup (creates user with password, sends OTP)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    let user = await User.findOne({ email });
    if (user && user.passwordHash) {
      req.session.error = 'Account already exists. Please log in.';
      return res.redirect('/login');
    }
    if (!user) {
      user = new User({ email, firstName, lastName });
    } else {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    // Generate and email OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      req.session.error = 'Could not send verification email. Try again.';
      return res.redirect('/login');
    }
    req.session.emailForVerification = email;
    req.session.success = 'Account created. Please verify OTP sent to your email.';
    return res.redirect('/verify');
  } catch (e) {
    console.error(e);
    req.session.error = 'Server error';
    return res.redirect('/login');
  }
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
    user.isVerified = true;
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
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/products'); // Still log them out on client
    }
    res.clearCookie('connect.sid'); // Clears the session cookie
    res.redirect('/'); // Redirect to home
  });
});

module.exports = router;
