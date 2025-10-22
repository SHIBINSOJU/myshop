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

// Product Details Page
router.get('/product/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).render('404', { 
        title: "Product Not Found",
        message: "The product you're looking for doesn't exist."
      });
    }

    // Get related products (same category, excluding current product)
    const relatedProducts = await Product.find({ 
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.render('product-details', {
      title: product.name,
      product: product,
      relatedProducts: relatedProducts
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).render('404', { 
      title: "Error",
      message: "Something went wrong while loading the product."
    });
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

// Cart Page
router.get('/cart', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('cart.product');
    
    const cartItems = user.cart || [];
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;
    
    res.render('cart', {
      title: 'Shopping Cart',
      cartItems: cartItems,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.redirect('/products');
  }
});

// Add to Cart
router.post('/cart/add', isAuthenticated, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = await User.findById(req.session.userId);
    
    const existingItem = user.cart.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      user.cart.push({ product: productId, quantity: parseInt(quantity) });
    }
    
    await user.save();
    res.json({ success: true, cartCount: user.cart.length });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Update Cart Item
router.post('/cart/update', isAuthenticated, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.session.userId);
    
    const item = user.cart.find(item => item.product.toString() === productId);
    if (item) {
      item.quantity = parseInt(quantity);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Remove from Cart
router.post('/cart/remove', isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.session.userId);
    
    user.cart = user.cart.filter(item => item.product.toString() !== productId);
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Checkout Page
router.get('/checkout', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('cart.product');
    
    if (!user.cart || user.cart.length === 0) {
      return res.redirect('/cart');
    }
    
    const cartItems = user.cart;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    res.render('checkout', {
      title: 'Checkout',
      cartItems: cartItems,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total
    });
  } catch (error) {
    console.error('Error loading checkout:', error);
    res.redirect('/cart');
  }
});

// Process Checkout
router.post('/checkout/process', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('cart.product');
    const Order = require('../models/order');
    
    if (!user.cart || user.cart.length === 0) {
      return res.redirect('/cart');
    }
    
    // Create order
    const order = new Order({
      user: user._id,
      items: user.cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        phone: req.body.phone
      },
      subtotal: user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      shippingCost: user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) >= 50 ? 0 : 9.99,
      tax: user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 0.08,
      total: user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + 
             (user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) >= 50 ? 0 : 9.99) +
             (user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 0.08),
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes
    });
    
    await order.save();
    
    // Add order to user
    user.orders.push(order._id);
    user.cart = []; // Clear cart
    await user.save();
    
    res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.redirect('/checkout');
  }
});

// Profile Page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('orders').populate('wishlist');
    
    res.render('profile', {
      title: 'My Profile',
      user: user
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.redirect('/products');
  }
});

// Update Profile
router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.session.userId);
    
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.redirect('/profile');
  }
});

// Update Address
router.post('/profile/address', isAuthenticated, async (req, res) => {
  try {
    const { street, city, state, zipCode } = req.body;
    const user = await User.findById(req.session.userId);
    
    user.address = {
      street,
      city,
      state,
      zipCode,
      country: 'US'
    };
    
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating address:', error);
    res.redirect('/profile');
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
