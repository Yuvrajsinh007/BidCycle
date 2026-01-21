const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/items', require('./routes/items'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.send('Online Auction API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});