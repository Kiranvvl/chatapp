const express = require('express');
const router = express.Router();
const {
  googleLogin,
  googleCallback,
  googleTokenLogin,
} = require('../controllers/auth');

// Google OAuth routes
router.get('/auth/google', googleLogin);
router.get('/auth/google/callback', googleCallback);
router.post('/auth/google-login', googleTokenLogin);

module.exports = router;
