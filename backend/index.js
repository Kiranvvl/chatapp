const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const sequelize = require('./config/db');
const userRouter = require('./routers/user');
const messageRouter = require('./routers/message');
const authRouter = require('./routers/auth');
const Message = require('./models/message');

// Load environment variables
dotenv.config();

const app = express();
app.use(helmet()); // Adds security-related HTTP headers

// Enable CORS for client app
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.BASE_URL,
        'http://localhost:3000',
      ].filter(Boolean);

      // Allow requests with no origin (e.g., mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Session setup (for OAuth with Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport.js
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Register routers
app.use('/api', userRouter);
app.use('/api', messageRouter);
app.use('/api', authRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Create HTTP server and bind to Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Track connected users
const users = new Map();

// Authenticate socket connections with JWT
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null);

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Invalid or missing token'));
    }

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    if (!decoded?.id) {
      return next(new Error('Invalid token payload'));
    }

    socket.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication failed'));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  const userId = socket.userId;
  if (!userId) return socket.disconnect();

  users.set(socket.id, userId);
  console.log(`User connected: ${userId}`);

  // Handle message sending
  socket.on('sendMessage', async (content) => {
    try {
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return socket.emit('messageError', {
          message: 'Message content cannot be empty',
        });
      }

      const newMessage = await Message.create({
        userId,
        content: content.trim(),
      });

      io.emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('messageError', {
        message: 'Error saving message',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    users.delete(socket.id);
    console.log(`User disconnected: ${userId}`);
  });
});

// Start the server and connect to the database
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const PORT = process.env.PORT || 8000;
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();
