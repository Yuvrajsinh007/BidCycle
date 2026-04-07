const Order = require('../models/Order');
const Item = require('../models/Item');
const Cart = require('../models/Cart');

// Buy Now — create an order for a direct-sale item
exports.buyNow = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;
    const buyerId = req.user._id;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    if (item.listingType !== 'direct') {
      return res.status(400).json({ message: 'This item is an auction listing. Use bidding instead.' });
    }

    if (item.seller.toString() === buyerId.toString()) {
      return res.status(400).json({ message: 'You cannot buy your own item.' });
    }

    if (item.stock < quantity) {
      return res.status(400).json({ 
        message: item.stock === 0 ? 'This item is out of stock.' : `Only ${item.stock} units available.` 
      });
    }

    // Atomically decrement stock to prevent race conditions
    const updatedItem = await Item.findOneAndUpdate(
      { _id: itemId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(400).json({ message: 'Item went out of stock. Please try again.' });
    }

    // Mark as out_of_stock if stock hit 0
    if (updatedItem.stock === 0) {
      updatedItem.status = 'out_of_stock';
      await updatedItem.save();
    }

    const total = item.price * quantity;

    const order = await Order.create({
      buyer: buyerId,
      seller: item.seller,
      item: itemId,
      quantity,
      price: item.price,
      total
    });

    await order.populate('item', 'title images price');
    await order.populate('seller', 'name email');

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      order 
    });
  } catch (error) {
    console.error('Buy Now error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Checkout Cart
exports.checkoutCart = async (req, res) => {
  try {
    const buyerId = req.user._id;

    const cart = await Cart.findOne({ user: buyerId }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Validate all items before processing
    for (const cartItem of cart.items) {
       const item = cartItem.item;
       if (!item) return res.status(400).json({ message: 'Some items in your cart no longer exist.' });
       if (item.stock < cartItem.quantity || item.status === 'out_of_stock') {
          return res.status(400).json({ message: `Insufficient stock for '${item.title}'. Please adjust quantity.` });
       }
    }

    const createdOrders = [];
    let grandTotal = 0;

    // Process orders serially to ensure atomicity
    for (const cartItem of cart.items) {
       const item = cartItem.item;
       const quantity = cartItem.quantity;
       const total = item.price * quantity;
       grandTotal += total;

       const updatedItem = await Item.findOneAndUpdate(
         { _id: item._id, stock: { $gte: quantity } },
         { $inc: { stock: -quantity } },
         { new: true }
       );

       if (!updatedItem) {
         // Should rarely hit this due to validation above, but handles race conditions
         return res.status(400).json({ message: `'${item.title}' went out of stock during checkout.` });
       }

       if (updatedItem.stock === 0) {
         updatedItem.status = 'out_of_stock';
         await updatedItem.save();
       }

       const order = await Order.create({
         buyer: buyerId,
         seller: item.seller,
         item: item._id,
         quantity,
         price: item.price,
         total
       });
       createdOrders.push(order);
    }

    // Clear cart after successful checkout
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Checkout successful! Your orders have been placed.',
      ordersCount: createdOrders.length,
      grandTotal
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error during checkout.' });
  }
};

// Get buyer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('item', 'title images price category listingType')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get seller's incoming orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('item', 'title images price category listingType')
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update order status (seller only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can update order status.' });
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await Item.findByIdAndUpdate(order.item, { 
        $inc: { stock: order.quantity },
        status: 'available'
      });
    }

    order.status = status;
    await order.save();

    await order.populate('item', 'title images price');
    await order.populate('buyer', 'name email');

    res.json({ message: `Order ${status}.`, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
