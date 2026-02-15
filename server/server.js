const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io
const cron = require('node-cron');
const connectDB = require('./config/db');

// Models
const Item = require('./models/Item');
const Bid = require('./models/Bid');
const { sendEmail } = require('./utils/emailService');

// Route Imports
const chatRoutes = require('./routes/chat'); // Import chat routes

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
app.use(express.json());

// --- CRON JOB FOR AUTOMATIC AUCTION CLOSING ---
// Runs every minute to check for expired auctions
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Find active items that have passed their end time
    const expiredItems = await Item.find({ 
      status: 'active', 
      endTime: { $lte: now } 
    });

    for (const item of expiredItems) {
      // Find highest bid
      const highestBid = await Bid.findOne({ item: item._id })
        .sort({ amount: -1 })
        .populate('bidder', 'name email'); // Populate email for notifications

      if (highestBid) {
        item.status = 'sold';
        item.winner = highestBid.bidder._id;
        item.currentBid = highestBid.amount;
        
        // 5. REAL-TIME NOTIFICATION: Item Sold
        io.emit('auction_ended', {
          itemId: item._id,
          status: 'sold',
          winner: highestBid.bidder,
          finalPrice: highestBid.amount
        });

        console.log(`Auction closed: Item ${item.title} sold to ${highestBid.bidder.name}`);
        // TODO: Trigger email service here
      } else {
        item.status = 'expired';
        
        // 5. REAL-TIME NOTIFICATION: Item Expired
        io.emit('auction_ended', {
           itemId: item._id,
           status: 'expired',
           winner: null,
           finalPrice: item.currentBid
        });

        console.log(`Auction expired: Item ${item.title} had no bids.`);
      }
      await item.save();
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});
// ----------------------------------------------

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); // Watchlist & Profile
app.use('/api/seller', require('./routes/seller'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/chat', chatRoutes); // Chat System
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.send('Online Auction API is running');
});

// 6. IMPORTANT: Listen on 'server', not 'app'
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});