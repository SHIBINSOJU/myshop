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

// Home Page (NEW CATEGORY-BASED)
router.get('/', async (req, res) => {
  try {
    // Manually define which categories to feature on the homepage
    const featuredCategories = ['apparel', 'accessories', 'footwear'];
    
    // An array to hold our category sections
    const categorySections = [];

    // Loop through each defined category and fetch its top 4 products
    for (const categoryName of featuredCategories) {
      const products = await Product.find({ category: categoryName })
        .sort({ rating: -1 }) // Sort by highest rating
        .limit(4);
      
      // If we found products, add this section to our array
      if (products.length > 0) {
        categorySections.push({
          name: categoryName,
          products: products
        });
      }
    }

    res.render('home', {
      title: 'Home',
      categorySections: categorySections // Pass this new array to the page
    });
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    // Fallback: render the page with no sections
    res.render('home', { title: 'Home', categorySections: [] });
  }
});

// Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

// --- Protected Routes ---

// Products Page
router.get('/products', isAuthenticated, async (req, res) => {
  try {
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

    const products = await Product.find(filterQuery).sort(sortQuery);
    const categories = await Product.distinct('category');
    
    res.render('products', {
      title: 'Products',
      products: products,
      categories: categories,
      currentCategory: category, 
      currentSort: sort 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/'); 
  }
});

// Wishlist Page
router.get('/wishlist', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('wishlist');
    
    res.render('wishlist', {
      title: 'Your Wishlist',
      wishlistItems: user.wishlist 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/products');
  }
});

// --- API Route for Wishlist ---

// POST /wishlist/toggle/:id 
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
