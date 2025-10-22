require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');
const products = require('./products.data.json');

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing products
    await Product.deleteMany();
    console.log('Cleared existing products.');

    // Insert new products
    await Product.insertMany(products);
    console.log('Sample data imported successfully!');
    
    process.exit();
  } catch (error) {
    console.error('Error with data import:', error);
    process.exit(1);
  }
};

// Run the function
importData();
