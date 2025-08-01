const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  createMessage,
  getMessage,
  getAllMessagesByUser,
  deleteMessage,
  upload,
  updateMessage,
  searchMessages,
} = require('../controllers/message');

router.post('/postmessage', verifyToken, upload.single('image'), createMessage);
router.get('/getmessage/:id', verifyToken, getMessage);
router.get('/getallmessage', verifyToken, getAllMessagesByUser);
router.put('/updatemessage/:id', verifyToken, updateMessage);
router.delete('/deletemessage/:id', verifyToken, deleteMessage);
router.get('/searchmessages', verifyToken, searchMessages);

module.exports = router;
