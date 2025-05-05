const User = require('../models/user');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { addHours } = require('date-fns');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate token expiry (24 hours from now)
// FIX THIS
const generateTokenExpiry = () => addHours(new Date(), 24); // Return Date, not timestamp

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_EMAIL_PASSWORD,
  },
});

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex'); // 32 bytes for more uniqueness
    const verificationTokenExpiry = generateTokenExpiry();

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    // Ensure API_BASE is correctly set in .env
    const verificationLink = `${process.env.BASE_URL}/Verify-Email/${verificationToken}`;

    console.log('Verification Link:', verificationLink); // Debugging

    // Send verification email
    try {
      await transporter.sendMail({
        from: `"Chat App" <${process.env.USER_EMAIL}>`,
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
      });
      console.log('Verification email sent successfully.');
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      await user.destroy(); // Rollback user creation if email fails
      return res.status(500).json({
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    return res.status(200).json({
      user,
      message: 'User registered successfully. Verification email sent.',
    });
  } catch (error) {
    console.error('Error in register function:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'User not found', success: false });
    }

    // Ensure email is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email first.', success: false });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: 'Invalid password', success: false });
    }

    // Ensure token key is correctly set
    const TOKEN_KEY = process.env.TOKEN_KEY;
    if (!TOKEN_KEY) {
      console.error('TOKEN_KEY is missing in environment variables.');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, TOKEN_KEY, { expiresIn: '8h' });

    // Set token in cookie
    res.cookie('Access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000, // 1 hour
    });

    return res.json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', success: false });
  }
};

const getProfile = (req, res) => {
  res.json({ user: req.user });
};

// const verifyEmail = async (req, res, next) => {
//   try {
//     const { token } = req.params;
//     const user = await User.findOne({ where: { verificationToken: token } });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid verification token',
//       });
//     }

//     if (user.verificationTokenExpiry < Date.now()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Verification token expired',
//       });
//     }

//     user.isVerified = true;
//     user.verificationToken = null;
//     user.verificationTokenExpiry = null;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Email verified successfully!',
//       user: {
//         id: user.id,
//         email: user.email,
//         username: user.username,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
      });
    }

    if (user.verificationTokenExpiry.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token expired',
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Generate a token for immediate login
    const TOKEN_KEY = process.env.TOKEN_KEY;
    if (!TOKEN_KEY) {
      console.error('TOKEN_KEY is missing in environment variables.');
      return res.status(500).json({ message: 'Internal server error' });
    }

    const authToken = jwt.sign({ id: user.id }, TOKEN_KEY, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token: authToken, // Send token for immediate login
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found with this email.' });
    }

    const resetPasswordToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordTokenExpiry = generateTokenExpiry();

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password/${resetPasswordToken}`;
    try {
      await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: email,
        subject: 'Reset Your Password',
        html: `<p>Please click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res
        .status(500)
        .json({ message: 'Failed to send password reset email.' });
    }

    res
      .status(200)
      .json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ where: { resetPasswordToken: token } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset password token.',
      });
    }

    if (user.resetPasswordTokenExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Reset password token has expired.',
      });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({
        message: 'New password cannot be the same as the old password.',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!req.user || userId !== req.user.id) {
      return res.status(401).json({ message: 'You are not authorized' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validFields = ['username', 'email'];
    const updates = {};
    for (const field of validFields) {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    }

    await user.update(updates);
    res.status(200).json({
      success: true,
      message: 'User data has been updated successfully',
      userData: user,
    });
  } catch (error) {
    next(error);
  }
};

const getdata = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      data: user,
      message: 'User data retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      offset,
      limit,
    });

    res.status(200).json({
      data: users,
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

const deletedata = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (userId !== req.user.id) {
      return res
        .status(401)
        .json({ message: 'You are not authorized to delete this user.' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.status(200).json({
      message: 'User data removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateUser,
  getdata,
  getAllUsers,
  deletedata,
  getProfile,
};
