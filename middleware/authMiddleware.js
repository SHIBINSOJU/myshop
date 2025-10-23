const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;

  // Check if token exists
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        req.user = decodedToken;
        next();
      }
    });
  } else {
    // If no token, check for session-based auth (for OTP users)
    if (req.session && req.session.userId) {
      return next();
    }
    res.redirect('/login');
  }
}

module.exports = { requireAuth };
