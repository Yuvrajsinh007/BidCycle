const Item = require('../models/Item');
const Bid = require('../models/Bid');
const upload = require('../middleware/upload');
const { sendEmail, getStyledHtml } = require('../utils/emailService'); // ADDED getStyledHtml

// Helper: Send Emails with Professional Styling
const sendAuctionResultEmails = async (item, winningBid) => {
  try {
    // Get all unique bidders for this item
    const allBids = await Bid.find({ item: item._id }).populate('bidder');
    const uniqueBidders = [...new Map(allBids.map(b => [b.bidder.email, b.bidder])).values()];

    const winnerEmail = winningBid.bidder.email;

    // Loop through bidders and send appropriate email
    for (const bidder of uniqueBidders) {
      const isWinner = bidder.email === winnerEmail;
      
      let subject, html, text;

      if (isWinner) {
        subject = `🎉 You Won! - ${item.title}`;
        text = `Congratulations! You won the auction for ${item.title} for $${winningBid.amount}.`;
        
        const content = `
          <p>Congratulations, <strong>${bidder.name}</strong>!</p>
          <p>You are the winning bidder for <span class="highlight">${item.title}</span>.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
             <p style="margin:0; font-size: 14px; color: #065f46;">Winning Bid Amount</p>
             <p style="margin:5px 0 0 0; font-size: 24px; font-weight: bold; color: #059669;">$${winningBid.amount}</p>
          </div>

          <p>The item is now yours! Please check your dashboard to contact the seller and arrange for delivery/payment.</p>
        `;

        const actionBtn = `<a href="${process.env.FRONTEND_URL || '#'}/items/${item._id}" class="btn">View Item Details</a>`;
        
        html = getStyledHtml('You Won the Auction! 🎉', content, actionBtn);

      } else {
        subject = `Auction Ended - ${item.title}`;
        text = `The auction for ${item.title} has ended. The winning bid was $${winningBid.amount}.`;

        const content = `
          <p>Hello <strong>${bidder.name}</strong>,</p>
          <p>The auction for <strong>${item.title}</strong> has officially ended.</p>
          <p>Unfortunately, you did not place the highest bid this time.</p>
          
          <ul style="background: #f9fafb; padding: 15px 20px; border-radius: 8px; list-style: none; margin: 20px 0;">
            <li style="margin-bottom: 5px;"><strong>Final Price:</strong> $${winningBid.amount}</li>
            <li><strong>Winner:</strong> ${winningBid.bidder.name}</li>
          </ul>

          <p>Don't worry! There are plenty more items waiting for you.</p>
        `;

        const actionBtn = `<a href="${process.env.FRONTEND_URL || '#'}/" class="btn">Browse More Items</a>`;

        html = getStyledHtml('Auction Ended', content, actionBtn);
      }

      await sendEmail(bidder.email, subject, text, html);
    }
    // console.log(`Auction emails sent for item: ${item._id}`);
  } catch (error) {
    console.error('Error sending auction emails:', error);
  }
};

// 3. Central Status Checker
const checkAndProcessAuctionStatus = async (item) => {
  const now = new Date();
  const start = new Date(item.startTime || item.createdAt);
  const end = new Date(item.endTime);
  let updated = false;

  // A. START: Upcoming -> Active
  if (item.status === 'upcoming' && now >= start) {
    item.status = 'active';
    updated = true;
  }

  // B. END: Active -> Sold/Expired
  if (item.status === 'active' && now >= end) {
    const highestBid = await Bid.findOne({ item: item._id })
      .sort({ amount: -1 })
      .populate('bidder');

    if (highestBid) {
      item.status = 'sold';
      item.winner = highestBid.bidder._id;
      item.currentBid = highestBid.amount;
      
      await item.save(); 
      updated = false;

      // Send emails
      sendAuctionResultEmails(item, highestBid).catch(err => 
        console.error('Email sending failed:', err)
      );
    } else {
      item.status = 'expired';
      updated = true;
    }
  }

  if (updated) await item.save();
};

// --- CONTROLLER METHODS (Standard methods) ---

exports.addItem = async (req, res) => {
  try {
    const { 
      title, description, category, basePrice, 
      auctionDuration, customEndTime, scheduleType, customStartTime 
    } = req.body;
    
    let imageUrls = [];
    if (req.files && req.files.length > 0) imageUrls = req.files.map(file => file.path);

    if (!title || !description || !category || !basePrice) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    let startTime = new Date();
    let status = 'active';

    if (scheduleType === 'scheduled' && customStartTime) {
      startTime = new Date(customStartTime);
      if (startTime > new Date()) status = 'upcoming';
    }

    let endTime;
    let finalDuration;

    if (customEndTime) {
      endTime = new Date(customEndTime);
      if (endTime <= startTime) return res.status(400).json({ message: 'End time must be after start time.' });
      finalDuration = (endTime - startTime) / (1000 * 60 * 60);
    } else {
      finalDuration = parseFloat(auctionDuration) || 24;
      endTime = new Date(startTime.getTime() + finalDuration * 60 * 60 * 1000);
    }
    
    const item = await Item.create({
      seller: req.user._id,
      title, description, category,
      images: imageUrls,
      basePrice, currentBid: basePrice,
      auctionDuration: finalDuration,
      startTime,
      endTime,
      status
    });
    
    await item.populate('seller', 'name email');
    res.status(201).json(item);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 12 } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    let items = await Item.find(query)
      .populate('seller', 'name')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });

    for (let item of items) {
      await checkAndProcessAuctionStatus(item);
    }

    if (status) {
        if (status === 'active') items = items.filter(i => ['active', 'upcoming'].includes(i.status));
        else if (status === 'ended') items = items.filter(i => ['sold', 'closed', 'expired'].includes(i.status));
        else items = items.filter(i => i.status === status);
    } else {
        items = items.filter(i => ['active', 'upcoming'].includes(i.status));
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      items: paginatedItems,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: startIndex + parseInt(limit) < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('winner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    await checkAndProcessAuctionStatus(item);
    res.json(item);
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user._id })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    for (let item of items) await checkAndProcessAuctionStatus(item);
    res.json(items);
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.editItem = async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found.' });
      if (item.seller.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });
      
      const bidCount = await Bid.countDocuments({ item: item._id });
      if (bidCount > 0) return res.status(400).json({ message: 'Cannot edit item with bids.' });
      if (item.endTime <= new Date()) return res.status(400).json({ message: 'Cannot edit ended auction.' });
      
      const { title, description, category, images, basePrice, auctionDuration } = req.body;
      
      if (title) item.title = title;
      if (description) item.description = description;
      if (category) item.category = category;
      if (images) item.images = images;
      if (basePrice && basePrice > 0) {
        item.basePrice = basePrice;
        item.currentBid = basePrice;
      }
      if (auctionDuration && auctionDuration > 0 && auctionDuration <= 720) {
        item.auctionDuration = auctionDuration;
        item.endTime = new Date(Date.now() + auctionDuration * 60 * 60 * 1000);
      }
      
      await item.save();
      await item.populate('seller', 'name email');
      res.json(item);
    } catch (error) {
      console.error('Edit item error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
};
  
exports.deleteItem = async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found.' });
      if (item.seller.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });
      
      const bidCount = await Bid.countDocuments({ item: item._id });
      if (bidCount > 0) return res.status(400).json({ message: 'Cannot delete item with bids.' });
      
      await Item.findByIdAndDelete(req.params.id);
      res.json({ message: 'Item deleted successfully.' });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
};

exports.getBidHistory = async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found.' });
      if (item.seller.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });
      
      const bids = await Bid.find({ item: item._id }).populate('bidder', 'name email').sort({ createdAt: -1 });
      res.json(bids);
    } catch (error) {
      console.error('Get bid history error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
};

exports.getItemBids = async (req, res) => {
    try {
      const bids = await Bid.find({ item: req.params.id }).populate('bidder', 'name email').sort({ createdAt: -1 });
      res.json(bids);
    } catch (error) {
      console.error('Get item bids error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
}; 
  
exports.uploadImages = async (req, res) => {
      try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found.' });
        if (item.seller.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });
    
        upload.array('images', 5)(req, res, async (err) => {
          if (err) return res.status(400).json({ message: err.message });
          if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No images uploaded.' });
          
          const imageUrls = req.files.map(file => file.path);
          item.images = [...item.images, ...imageUrls];
          await item.save();
          res.json({ message: 'Images uploaded successfully.', images: item.images });
        });
      } catch (error) {
        console.error('Upload images error:', error);
        res.status(500).json({ message: 'Server error.' });
      }
};