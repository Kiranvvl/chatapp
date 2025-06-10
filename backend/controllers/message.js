const Message = require('../models/message');
const { Op } = require('sequelize');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary safely
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Cloudinary configuration missing');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage for images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'message_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    public_id: (req, file) => `msg_${Date.now()}_${file.originalname}`,
  },
});

// In the upload configuration:
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  },
});

const createMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    const imageFile = req.file;

    // Validation checks
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Check if we have either message content OR an image
    if ((!message || message.trim() === '') && !imageFile) {
      return res
        .status(400)
        .json({ message: 'Message content or image is required' });
    }

    if (!req.user?.id) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - User not authenticated' });
    }

    // Process image if exists
    let imageUrl = null;
    let imagePublicId = null;

    if (imageFile) {
      imageUrl = imageFile.path || imageFile.url;
      imagePublicId = imageFile.filename || imageFile.public_id;
      if (!imageUrl || !imagePublicId) {
        return res
          .status(500)
          .json({ message: 'Image upload details missing' });
      }
    }

    const newMessage = await Message.create({
      senderId: req.user.id,
      receiverId,
      message: message?.trim() || '', // Change null to empty string
      imageUrl,
      imagePublicId,
    });

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error creating message:', error);
    next({
      status: 500,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
};

const getMessage = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return next({ status: 404, message: 'Message not found' });

    // Check if user is either sender or receiver
    if (
      message.senderId !== req.user.id &&
      message.receiverId !== req.user.id
    ) {
      return next({
        status: 403,
        message: 'Unauthorized to view this message',
      });
    }

    res.status(200).json({
      message: 'Message retrieved successfully',
      data: message,
    });
  } catch (error) {
    console.error('Error getting message:', error);
    next({
      status: 500,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
};

const getAllMessagesByUser = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next({
        status: 401,
        message: 'Unauthorized - User not authenticated',
      });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: messages.length
        ? 'Messages retrieved successfully'
        : 'No messages found',
      data: messages,
    });
  } catch (error) {
    console.error('Error getting user messages:', error);
    next({
      status: 500,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
};

const updateMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const existingMessage = await Message.findByPk(req.params.id);

    if (!existingMessage) {
      return next({ status: 404, message: 'Message not found' });
    }

    // Only sender can update the message
    if (existingMessage.senderId !== req.user.id) {
      return next({ status: 403, message: 'Unauthorized action' });
    }

    // For text messages, ensure content is not empty
    if (!existingMessage.imageUrl && (!message || message.trim() === '')) {
      return next({ status: 400, message: 'Message content cannot be empty' });
    }

    // For image messages, allow empty text updates (just keep the image)
    if (existingMessage.imageUrl) {
      existingMessage.message = message?.trim() || '';
    } else {
      // For text-only messages, require content
      existingMessage.message = message.trim();
    }

    await existingMessage.save();

    res.status(200).json({
      message: 'Message updated successfully',
      data: existingMessage,
    });
  } catch (error) {
    console.error('Error updating message:', error);
    next({
      status: 500,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return next({ status: 404, message: 'Message not found' });

    // Allow deletion if the user is either the sender or the receiver
    if (
      message.senderId !== req.user.id &&
      message.receiverId !== req.user.id
    ) {
      return next({ status: 403, message: 'Unauthorized action' });
    }

    // Delete image from Cloudinary if it exists
    if (message.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(message.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with message deletion even if image deletion fails
      }
    }

    await message.destroy();
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    next({
      status: 500,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
};

module.exports = {
  createMessage,
  getMessage,
  getAllMessagesByUser,
  updateMessage,
  deleteMessage,
  upload,
};
