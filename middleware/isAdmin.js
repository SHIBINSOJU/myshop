// This is our new middleware
const isAdmin = (req, res, next) => {
  // Check if user is logged in AND their email matches the admin email
  if (req.session.userId && res.locals.user.email === process.env.ADMIN_EMAIL) {
    // They are an admin, let them proceed
    return next();
  }
  
  // Not an admin, send them to the homepage
  res.redirect('/');
};

module.exports = isAdmin;
