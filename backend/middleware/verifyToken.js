const jwt = require('jsonwebtoken');
const errorHandler = require('../middleware/errorHandler');
// const cookieParser = require('cookie-parser'); // Ensure this is used in your app

// Middleware to verify token from cookies or Authorization header
const verifyToken = (req, res, next) => {
  // console.log('Cookies:', req.cookies);
  // console.log('Headers:', req.headers);

  // Extract token from cookies
  let token = req.cookies?.Access_token; // Ensure this matches the actual cookie name

  // If not found in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers?.authorization;
    // console.log('authHeader:', authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // If still no token, return an error
  if (!token) {
    return next(errorHandler(401, 'Token not authorized. Please log in.'));
  }

  // Verify JWT token
  jwt.verify(token, process.env.TOKEN_KEY, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return next(errorHandler(401, 'Unauthorized user'));
    }

    req.user = user; // Attach user data to request object
    next();
  });
};

module.exports = verifyToken;
