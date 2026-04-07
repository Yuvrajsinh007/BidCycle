const Razorpay = require('razorpay');
const crypto = require('crypto');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const Cart = require('../models/Cart');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);

    if (!item || item.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized or item not found" });
    }

    const options = {
      amount: item.currentBid * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${itemId}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: item.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCartPayment = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }
    
    let grandTotal = 0;
    cart.items.forEach(cartItem => {
       grandTotal += cartItem.item.price * cartItem.quantity;
    });

    const options = {
      amount: grandTotal * 100,
      currency: "INR",
      receipt: `cart_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemId } = req.body;

    // Verify the signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      // 1. Update Item Status
      await Item.findByIdAndUpdate(itemId, { status: 'paid' });

      // 2. Create Transaction Record
      await Transaction.create({
        item: itemId,
        buyer: req.user._id,
        amount: req.body.amount / 100,
        paymentGatewayId: razorpay_payment_id,
        status: 'completed'
      });

      // 3. Notify via Socket
      const io = req.app.get('io');
      io.to(`chat_${itemId}`).emit('payment_received', { itemId, status: 'paid' });

      res.status(200).json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};