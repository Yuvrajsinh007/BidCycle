const Cart = require('../models/Cart');
const Item = require('../models/Item');

// 1. Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.item',
      select: 'title images price stock seller status listingType'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.listingType !== 'direct') return res.status(400).json({ message: 'Cannot add auction item to cart.' });
    if (item.status === 'out_of_stock' || item.stock < quantity) {
       return res.status(400).json({ message: 'Insufficient stock.' });
    }
    if (item.seller.toString() === req.user._id.toString()) {
       return res.status(400).json({ message: 'Cannot buy your own item.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingCartItemIndex = cart.items.findIndex(i => i.item.toString() === itemId);

    if (existingCartItemIndex > -1) {
      const newQuantity = cart.items[existingCartItemIndex].quantity + quantity;
      if (newQuantity > item.stock) return res.status(400).json({ message: 'Exceeds available stock.' });
      cart.items[existingCartItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ item: itemId, quantity });
    }

    await cart.save();
    await cart.populate({ path: 'items.item', select: 'title images price stock seller status' });
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity <= 0) return res.status(400).json({ message: 'Quantity must be at least 1' });

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.item');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const cartItem = cart.items.find(i => i.item._id.toString() === itemId);
    if (!cartItem) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity > cartItem.item.stock) {
      return res.status(400).json({ message: 'Exceeds available stock' });
    }

    cartItem.quantity = quantity;
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Remove item
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.item.toString() !== itemId);
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Remove Cart Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
