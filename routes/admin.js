const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const isAdmin = require('../middleware/isAdmin'); // Import our new middleware

// All routes in this file are protected by the 'isAdmin' middleware
router.use(isAdmin);

// GET /admin - Show the admin dashboard
router.get('/admin', async (req, res) => {
  try {
    // Get dashboard statistics
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Get recent data for tables
    const products = await Product.find().sort({ createdAt: -1 }).limit(20);
    const recentOrders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(20);
    const users = await User.find().sort({ createdAt: -1 }).limit(20);
    
    // Get top products (you can implement this based on your needs)
    const topProducts = await Product.find().sort({ rating: -1 }).limit(5);
    
    res.render('admin', { 
      title: 'Admin Dashboard',
      message: req.query.message,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue
      },
      products,
      orders: recentOrders,
      users,
      topProducts
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.render('admin', { 
      title: 'Admin Dashboard',
      message: 'Error loading dashboard data',
      stats: { totalProducts: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0 },
      products: [],
      orders: [],
      users: [],
      topProducts: []
    });
  }
});

// POST /admin/add-product - Handle the new product form
router.post('/admin/add-product', async (req, res) => {
  try {
    // This is the line to update
const { name, description, brand, image, price, originalPrice, category, rating, numRatings } = req.body;

// This is the object to update
const newProduct = new Product({
  name,
  description,
  brand,
  image,
  price: parseFloat(price),
  originalPrice: originalPrice ? parseFloat(originalPrice) : null,
  category: category.toLowerCase(),
  rating: rating ? parseFloat(rating) : 4.5,
  numRatings: numRatings ? parseInt(numRatings) : 0
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
