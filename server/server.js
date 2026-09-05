require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io');

// Import your routes
const transactionRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  console.log(`⚡ A user connected: ${socket.id}`);

  // Securely join a user to their own private room using their Database ID
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their secure data room.`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make 'io' globally accessible to all your route files!
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gmail', require('./routes/gmail'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/budgets', require('./routes/budgets'));

console.log("Checking URI:", process.env.MONGO_URI);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Basic Route
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;
// CRITICAL: Use server.listen, NOT app.listen!
server.listen(PORT, () => console.log(`Server & Socket.IO running on port ${PORT}`));