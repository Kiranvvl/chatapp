const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  register,
  login,
  updateUser,
  getdata,
  getAllUsers,
  deletedata,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
} = require('../controllers/user');
const passport = require('passport');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/updatedata/:id', verifyToken, updateUser);
router.get('/getdata/:id', verifyToken, getdata);
router.get('/getalldata', verifyToken, getAllUsers);
router.delete('/deletedata/:id', verifyToken, deletedata);

module.exports = router;
