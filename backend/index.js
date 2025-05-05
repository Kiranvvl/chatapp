const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const sequelize = require('./config/db');
const userRouter = require('./routers/user');
const messageRouter = require('./routers/message');
const authRouter = require('./routers/auth');
const jwt = require('jsonwebtoken');
const Message = require('./models/message');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Security Headers (Should be applied early)
app.use(helmet());

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.BASE_URL, 'http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Session management for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, // Ensure the cookie is only accessible via HTTP(S)
      sameSite: 'lax', // Prevent CSRF attacks
    },
  })
);

// Initialize Passport
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api', userRouter);
app.use('/api', messageRouter);
app.use('/api', authRouter);

// Global Security Headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal server error' });
});

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const users = new Map(); // Track users by socket ID

// Middleware for authenticating Socket.IO connections
io.use((socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    let token =
      socket.handshake.auth?.token ||
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error: Token must be a string'));
    }

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    if (!decoded?.id) {
      return next(new Error('Invalid token payload'));
    }

    socket.userId = decoded.id;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return next(new Error('Invalid token'));
  }
});

// Handle Socket.IO Connections
io.on('connection', (socket) => {
  const userId = socket.userId;
  if (!userId) return socket.disconnect();

  users.set(socket.id, userId);
  console.log(`User connected: ${userId}`);

  // Handle sending messages
  socket.on('sendMessage', async (content) => {
    try {
      if (!content || content.trim() === '') {
        return socket.emit('messageError', {
          message: 'Message content cannot be empty',
        });
      }

      const newMessage = await Message.create({ userId, content });

      io.emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('messageError', { message: 'Error saving message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    users.delete(socket.id);
    console.log(`User disconnected: ${userId}`);
  });
});

// Authenticate database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Sync database and start the server
const PORT = process.env.PORT || 8000;
sequelize.sync({ alter: process.env.NODE_ENV !== 'production' }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
