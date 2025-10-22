// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const User = require('./models/user'); // Import the User model
const { requireAuth } = require('./middleware/authMiddleware'); // Import auth middleware


// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin'); // Import admin routes

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- 2. Middleware ---
// To parse form data from EJS pages
app.use(express.urlencoded({ extended: true }));
// To parse JSON request bodies (for AJAX requests like add-to-cart)
app.use(express.json());
// To serve static files (CSS, images, frontend JS)
app.use(express.static('public'));
app.use(cookieParser());


// Setup EJS as the view engine
app.set('view engine', 'ejs');

// Setup secure sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// --- CUSTOM MIDDLEWARE ---
// This makes session user and brandName available to all EJS templates
app.use(async (req, res, next) => {
  res.locals.brandName = "Pixelcart"; // Make brand name global
  res.locals.user = null; // Default to null
  // Expose current path and query to all templates for active nav states and search
  res.locals.currentPath = req.path;
  res.locals.currentQuery = req.query || {};
  // Global currency formatter: INR
  res.locals.formatPrice = (value) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
    } catch (e) {
      return `₹${Number(value || 0).toLocaleString('en-IN')}`;
    }
  };

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
app.use('/admin', requireAuth, adminRoutes);


// 404 Page (Must be at the end)
app.use((req, res) => {
  res.status(404).render('404', { 
    title: "Not Found"
    // brandName and user are already available from our middleware
  });
});

// --- 4. Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
