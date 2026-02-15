const Bid = require('../models/Bid');
const Item = require('../models/Item');

// Place a bid (Proxy Bidding Implementation)
exports.placeBid = async (req, res) => {
  try {
    const { amount } = req.body; // User's Maximum Bid
    const itemId = req.params.id;
    const bidderId = req.user._id;
    const io = req.app.get('io'); 
    const minIncrement = 1; // Minimum increment of $1

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid bid amount.' });
    }

    // 1. Fetch Item along with the SECRET highestMaxBid field
    const item = await Item.findById(itemId).select('+highestMaxBid');
    
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.status !== 'active' || new Date(item.endTime) <= new Date()) {
      return res.status(400).json({ message: 'Auction has ended.' });
    }
    if (item.seller.toString() === bidderId.toString()) {
      return res.status(400).json({ message: 'Cannot bid on your own item.' });
    }

    const currentPrice = item.currentBid || item.basePrice;
    const currentLeaderMax = item.highestMaxBid || 0;
    const currentWinner = item.winner;

    // Validation: Bid must be higher than visible price (unless you are the winner updating max)
    if (amount <= currentPrice && (!currentWinner || currentWinner.toString() !== bidderId.toString())) {
       return res.status(400).json({ message: `Bid must be higher than $${currentPrice}.` });
    }

    // --- SCENARIO 1: First Bidder ---
    if (!currentWinner) {
       item.currentBid = item.basePrice; 
       item.highestMaxBid = amount;
       item.winner = bidderId;
       
       await Bid.create({ item: itemId, bidder: bidderId, amount: item.basePrice });
       await item.save();

       io.emit('bid_update', { itemId, currentBid: item.currentBid, bidderName: req.user.name });
       return res.status(201).json({ message: 'Bid placed!', currentPrice: item.currentBid });
    }

    // --- SCENARIO 2: Current Winner Updates Their Max Bid ---
    if (currentWinner.toString() === bidderId.toString()) {
       if (amount <= currentLeaderMax) {
           return res.status(400).json({ message: 'New max bid must be higher than your current max.' });
       }
       item.highestMaxBid = amount; // Silently update max limit
       await item.save();
       return res.status(200).json({ message: 'Max bid updated successfully.', currentPrice: item.currentBid });
    }

    // --- SCENARIO 3: BATTLE (Challenger vs Leader) ---

    // A. Challenger LOSES (Their Max <= Leader's Max)
    if (amount <= currentLeaderMax) {
        // Record Challenger's attempt
        await Bid.create({ item: itemId, bidder: bidderId, amount: amount });

        // Calculate Auto-Defense Bid for Leader
        // Leader automatically bids Challenger's Amount + Increment (capped at Leader's Max)
        const newSafePrice = Math.min(amount + minIncrement, currentLeaderMax);
        
        item.currentBid = newSafePrice;
        await item.save();

        // Record the Auto-Bid
        await Bid.create({ item: itemId, bidder: currentWinner, amount: newSafePrice });

        io.emit('bid_update', { 
            itemId, 
            currentBid: newSafePrice, 
            bidderName: "Auto-Bid" 
        });

        // --- IMPROVEMENT: TIE-BREAKER MESSAGE ---
        // If the calculated price exactly matches the user's bid, it means they tied the max but lost due to time priority.
        if (newSafePrice === amount) {
             return res.status(201).json({ 
                message: `Bid matched! But the current leader placed this max bid earlier. You need to bid higher than $${newSafePrice}.`, 
                currentPrice: newSafePrice 
            });
        }
        // ----------------------------------------

        return res.status(201).json({ 
            message: `You were outbid by an automatic bid! Current price is $${newSafePrice}.`, 
            currentPrice: newSafePrice 
        });
    }

    // B. Challenger WINS (Their Max > Leader's Max)
    if (amount > currentLeaderMax) {
        // Calculate new price: Previous Leader's Max + Increment
        // Cap at Challenger's Max (in case increment pushes it over)
        const newPrice = Math.min(currentLeaderMax + minIncrement, amount);

        // Update Item with new Winner
        item.currentBid = newPrice;
        item.highestMaxBid = amount;
        item.winner = bidderId;
        await item.save();

        // Record Winning Bid
        const newBid = await Bid.create({ item: itemId, bidder: bidderId, amount: newPrice });
        await newBid.populate('bidder', 'name');

        io.emit('bid_update', { itemId, currentBid: newPrice, bidderName: req.user.name });
        
        return res.status(201).json({ message: 'You are the highest bidder!', currentPrice: newPrice });
    }

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

    for (let bid of bids) {
      if (bid.item) await bid.item.updateStatus();
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
        match: { status: 'active', endTime: { $gt: new Date() } },
        populate: { path: 'seller', select: 'name email' }
      })
      .sort({ createdAt: -1 });
    const validBids = activeBids.filter(bid => bid.item);
    res.json(validBids);
  } catch (error) {
    console.error('Get active bids error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};