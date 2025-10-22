const express = require('express');
const router = express.Router();

const BRAND_NAME = "YourBrandName";

// --- Middleware to check if user is logged in ---
// This is the gatekeeper for protected pages
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    // User is logged in, proceed
    return next();
  }
  // User is not logged in, redirect to login
  res.redirect('/login');
};

// --- Public Routes ---

// Home Page
router.get('/', (req, res) => {
  res.render('home', {
    title: 'Home',
    brandName: BRAND_NAME
  });
});

// Contact Page
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us',
    brandName: BRAND_NAME
  });
});

// --- Protected Routes ---
// These routes use our 'isAuthenticated' middleware

// Products Page
router.get('/products', isAuthenticated, (req, res) => {
  res.render('products', {
    title: 'Products',
    brandName: BRAND_NAME
  });
});

// Wishlist Page (client-side, but let's make a page for it)
router.get('/wishlist', (req, res) => {
  res.render('wishlist', {
    title: 'Your Wishlist',
    brandName: BRAND_NAME
  });
});

module.exports = router;
