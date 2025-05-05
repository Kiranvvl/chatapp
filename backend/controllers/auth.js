const passport = require('passport');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth Redirect Flow
const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false, // Explicitly disabling session
});

// Google OAuth Callback
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      console.error('Google authentication failed:', err || 'No user found');
      return res.redirect(process.env.FAILURE_REDIRECT_URL);
    }

    try {
      const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY, {
        expiresIn: '1h',
      });

      // Ensure token is URL-safe
      res.redirect(
        `${process.env.SUCCESS_REDIRECT_URL}?token=${encodeURIComponent(token)}`
      );
    } catch (error) {
      console.error('JWT Token Generation Error:', error);
      return res.redirect(process.env.FAILURE_REDIRECT_URL);
    }
  })(req, res, next);
};

// Google Login with Token Exchange (Frontend Direct Login)
const googleTokenLogin = async (req, res) => {
  try {
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);

    const { credential } = req.body;
    if (!credential) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing credential token' });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid token payload' });
    }

    console.log('Google Token Payload:', payload);

    const { sub: googleId, email, name, picture } = payload;

    // Ensure email exists (Google may sometimes not provide it)
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account must have an email',
      });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create a new user if not found
      user = await User.create({
        googleId,
        email,
        username: name, // Ensure your User model has 'username'
        profilePicture: picture, // Ensure your User model has 'profilePicture'
        isVerified: true, // Mark user as verified
      });
    } else {
      // Update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
      }
    }

    console.log('Authenticated User:', user.toJSON());

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY, {
      expiresIn: '8h',
    });

    res.json({ success: true, user, token });
  } catch (error) {
    console.error('Google Token Verification Failed:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

module.exports = {
  googleLogin,
  googleCallback,
  googleTokenLogin,
};
