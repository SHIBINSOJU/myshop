const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const isAdmin = require('../middleware/isAdmin'); // Import our new middleware

// All routes in this file are protected by the 'isAdmin' middleware
router.use(isAdmin);

// GET /admin - Show the admin dashboard
router.get('/admin', (req, res) => {
  res.render('admin', { 
    title: 'Admin Panel',
    message: req.query.message // To show success messages
  });
});

// POST /admin/add-product - Handle the new product form
router.post('/admin/add-product', async (req, res) => {
  try {
    // This is the line to update
const { name, description, brand, image, price, originalPrice, category, rating, numRatings } = req.body;

    // Create a new product object
    const newProduct = new Product({
      name,
      image,
      price: parseFloat(price),
      category: category.toLowerCase(),
      rating: rating ? parseFloat(rating) : 4.5 // Default rating if empty
    });

    // Save it to the database
    await newProduct.save();

    // Redirect back to the admin page with a success message
    res.redirect('/admin?message=Product added successfully!');

  } catch (error) {
    console.error('Error adding product:', error);
    res.redirect('/admin?message=Error adding product.');
  }
});

module.exports = router;
