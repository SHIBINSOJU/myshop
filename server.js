// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/user'); // Import the User model

// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. Middleware ---
// To parse form data from EJS pages
app.use(express.urlencoded({ extended: true }));
// To serve static files (CSS, images, frontend JS)
app.use(express.static('public'));

// Setup EJS as the view engine
app.set('view engine', 'ejs');

// Setup secure sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// --- CUSTOM MIDDLEWARE ---
// This makes session user and brandName available to all EJS templates
app.use(async (req, res, next) => {
  res.locals.brandName = "YourBrandName"; // Make brand name global
  res.locals.user = null; // Default to null

  if (req.session.userId) {
    // If there's a user ID in the session, fetch the user from DB
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = user; // Make user object available in EJS
      } else {
        // User not found, clear the bad session
        req.session.destroy();
      }
    } catch (error) {
      console.error("Error fetching user for session: ", error);
    }
  }
  next();
});

// --- 3. Routes ---
// Use the route files
app.use('/', authRoutes);
app.use('/', storeRoutes);

// 404 Page (Must be at the end)
app.use((req, res) => {
  res.status(404).render('404', { 
    title: "Not Found",
    brandName: "YourBrandName" 
    // user is already available from our middleware
  });
});

// --- 4. Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
