const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io

const connectDB = require('./config/db');
const startAuctionCronJob = require('./utils/auctionCron');



// Route Imports
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');
const { verifyPayment } = require('./controllers/paymentController');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// 3. Create HTTP Server explicitly (Required for Socket.io)
const server = http.createServer(app);

// 4. Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible in controllers (req.app.get('io'))
app.set('io', io);

// Socket Connection Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Allow clients to join specific item rooms for updates (Bidding)
  socket.on('join_item', (itemId) => {
    socket.join(itemId);
  });

  // --- NEW: Join Chat Room ---
  socket.on('join_chat', (itemId) => {
    socket.join(`chat_${itemId}`); // Distinct room for chat
    console.log(`User ${socket.id} joined chat for item ${itemId}`);
  });
  // ---------------------------

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), verifyPayment);
app.use(express.json());



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => {
  res.send('Online Auction API is running');
});

startAuctionCronJob(io);

// 6. IMPORTANT: Listen on 'server', not 'app'
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});