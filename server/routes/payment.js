const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order/:itemId', protect, createOrder);
// Note: verifyPayment is used in server.js for the raw webhook route
module.exports = router;