const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Import Product model
const User = require('../models/user'); // Import User model

// --- Middleware to check if user is logged in ---
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// --- Public Routes ---

// Home Page
router.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

// --- Protected Routes ---

// Products Page
router.get('/products', isAuthenticated, async (req, res) => {
  try {
    // Fetch all products from MongoDB
    const products = await Product.find();
    
    // We pass the products to the EJS page
    res.render('products', {
      title: 'Products',
      products: products 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/'); // Redirect home on error
  }
});

// Wishlist Page
router.get('/wishlist', isAuthenticated, async (req, res) => {
  try {
    // Find the user and populate their wishlist with product details
    const user = await User.findById(req.session.userId).populate('wishlist');
    
    res.render('wishlist', {
      title: 'Your Wishlist',
      wishlistItems: user.wishlist // Pass the populated items
    });
  } catch (error) {
    console.error(error);
    res.redirect('/products');
  }
});

// --- API Route for Wishlist ---

// POST /wishlist/toggle/:id - Add or remove from wishlist
router.post('/wishlist/toggle/:productId', isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if product is already in the wishlist
    const index = user.wishlist.indexOf(productId);
    let action;

    if (index > -1) {
      // Product exists, so remove it
      user.wishlist.pull(productId);
      action = 'removed';
    } else {
      // Product doesn't exist, so add it
      user.wishlist.push(productId);
      action = 'added';
    }
    
    await user.save();
    
    res.json({ success: true, action: action, wishlist: user.wishlist });

  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

