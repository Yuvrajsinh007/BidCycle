const Bid = require('../models/Bid');
const Item = require('../models/Item');

// Place a bid
exports.placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const itemId = req.params.id;
    const bidderId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount.' });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Update item status first
    await item.updateStatus();

    // Check if auction is still active
    if (item.status !== 'active' || item.endTime <= new Date()) {
      return res.status(400).json({ message: 'Auction has ended.' });
    }

    // Check if user is not the seller
    if (item.seller.toString() === bidderId.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own item.' });
    }

    // Check if user is banned
    if (req.user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    // Get current highest bid
    const currentPrice = item.currentBid || item.basePrice;
    
    // Check if bid is higher than current price
    if (amount <= currentPrice) {
      return res.status(400).json({ 
        message: `Bid must be higher than $${currentPrice}.` 
      });
    }

    // Check if user already has the highest bid
    const highestBid = await Bid.findOne({ item: itemId })
      .sort({ amount: -1 })
      .populate('bidder', '_id');
    
    if (highestBid && highestBid.bidder._id.toString() === bidderId.toString()) {
      return res.status(400).json({ 
        message: 'You already have the highest bid.' 
      });
    }

    // Create the bid
    const bid = await Bid.create({
      item: itemId,
      bidder: bidderId,
      amount
    });

    // Update item's current bid
    item.currentBid = amount;
    await item.save();

    // Populate bidder info for response
    await bid.populate('bidder', 'name email');

    res.status(201).json({
      bid,
      message: 'Bid placed successfully!',
      currentPrice: amount
    });
  } catch (error) {
    console.error('Bid placement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get user's bids
exports.getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate('item')
      .populate('bidder', 'name email')
      .sort({ createdAt: -1 });

    // Update item status for each bid
    for (let bid of bids) {
      if (bid.item) {
        await bid.item.updateStatus();
      }
    }

    res.json(bids);
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get user's won auctions
exports.getWonAuctions = async (req, res) => {
  try {
    const wonItems = await Item.find({ 
      winner: req.user._id,
      status: { $in: ['expired', 'sold'] }
    })
    .populate('seller', 'name email')
    .populate('winner', 'name email')
    .sort({ endTime: -1 });

    res.json(wonItems);
  } catch (error) {
    console.error('Get won auctions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get user's active bids
exports.getActiveBids = async (req, res) => {
  try {
    const activeBids = await Bid.find({ bidder: req.user._id })
      .populate({
        path: 'item',
        match: { 
          status: 'active',
          endTime: { $gt: new Date() }
        },
        populate: { path: 'seller', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    // Filter out bids for inactive items
    const validBids = activeBids.filter(bid => bid.item);

    res.json(validBids);
  } catch (error) {
    console.error('Get active bids error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
