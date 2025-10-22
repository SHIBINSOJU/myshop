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
router.get('/', async (req, res) => {
  try {
    // Fetch 4 featured products (sorted by highest rating)
    const featuredProducts = await Product.find()
      .sort({ rating: -1 }) // Sort by rating descending
      .limit(4); // Get the top 4

    res.render('home', {
      title: 'Home',
      featuredProducts: featuredProducts // Pass products to the page
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    // Still render the page, just with no products
    res.render('home', { title: 'Home', featuredProducts: [] });
  }
});

// Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

// --- Protected Routes ---

// Products Page (NOW WITH FILTERS)
router.get('/products', isAuthenticated, async (req, res) => {
  try {
    // --- Filter & Sort Logic ---
    const { category, sort } = req.query;
    
    let filterQuery = {};
    if (category) {
      filterQuery.category = category;
    }

    let sortQuery = {};
    if (sort === 'price-low-high') {
      sortQuery = { price: 1 };
    } else if (sort === 'price-high-low') {
      sortQuery = { price: -1 };
    } else if (sort === 'rating') {
      sortQuery = { rating: -1 };
    } else {
      sortQuery = { createdAt: -1 }; // Default: newest
    }
    // --- End Logic ---

    // Fetch all products matching the filter
    const products = await Product.find(filterQuery).sort(sortQuery);
    
    // Fetch all unique categories to populate the filter dropdown
    const categories = await Product.distinct('category');
    
    res.render('products', {
      title: 'Products',
      products: products,
      categories: categories,
      currentCategory: category, // Pass current filter
      currentSort: sort // Pass current sort
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

    const index = user.wishlist.indexOf(productId);
    let action;

    if (index > -1) {
      user.wishlist.pull(productId);
      action = 'removed';
    } else {
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
