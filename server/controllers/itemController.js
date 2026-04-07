const Item = require('../models/Item');
const Bid = require('../models/Bid');
const upload = require('../middleware/upload');
const { sendEmail, getStyledHtml } = require('../utils/emailService');

// Helper: Send Emails with Professional Styling\
const sendAuctionResultEmails = async (item, winningBid) => {
  try {
    // 1. Populate seller to get their email
    await item.populate('seller');

    // 2. Get all unique bidders for this item
    const allBids = await Bid.find({ item: item._id }).populate('bidder');
    const uniqueBidders = [...new Map(allBids.map(b => [b.bidder.email, b.bidder])).values()];

    const winnerEmail = winningBid.bidder.email;

    // --- EMAIL THE SELLER ---
    if (item.seller && item.seller.email) {
      const sellerSubject = `Item Sold! - ${item.title}`;
      const sellerText = `Your auction for ${item.title} ended. It sold for $${winningBid.amount}.`;
      const sellerContent = `
        <p>Hello <strong>${item.seller.name}</strong>,</p>
        <p>Great news! Your auction for <strong>${item.title}</strong> has successfully ended.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
           <p style="margin:0; font-size: 14px; color: #64748b;">Final Sale Price</p>
           <p style="margin:5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f172a;">$${winningBid.amount}</p>
        </div>

        <p><strong>Winner:</strong> ${winningBid.bidder.name}</p>
        <p>Please check your dashboard to contact the buyer and arrange for payment and delivery.</p>
      `;
      // Added inline styles for the button
      const sellerBtn = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/items/${item._id}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Auction Details</a>`;
      
      const sellerHtml = getStyledHtml('Your Item Has Sold!', sellerContent, sellerBtn);
      await sendEmail(item.seller.email, sellerSubject, sellerText, sellerHtml);
    }

    // --- EMAIL THE BIDDERS (Winner and Losers) ---
    for (const bidder of uniqueBidders) {
      const isWinner = bidder.email === winnerEmail;
      let subject, html, text;

      if (isWinner) {
        subject = `🎉 You Won! - ${item.title}`;
        text = `Congratulations! You won the auction for ${item.title} for $${winningBid.amount}.`;
        
        const content = `
          <p>Congratulations, <strong>${bidder.name}</strong>!</p>
          <p>You are the winning bidder for <strong>${item.title}</strong>.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
             <p style="margin:0; font-size: 14px; color: #065f46;">Winning Bid Amount</p>
             <p style="margin:5px 0 0 0; font-size: 24px; font-weight: bold; color: #059669;">$${winningBid.amount}</p>
          </div>

          <p>The item is now yours! Please check your dashboard to contact the seller and arrange for delivery/payment.</p>
        `;

        // Added inline styles for the button
        const actionBtn = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/items/${item._id}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Claim Your Item</a>`;
        
        html = getStyledHtml('You Won the Auction! 🎉', content, actionBtn);

      } else {
        subject = `Auction Ended - ${item.title}`;
        text = `The auction for ${item.title} has ended. The winning bid was $${winningBid.amount}.`;

        const content = `
          <p>Hello <strong>${bidder.name}</strong>,</p>
          <p>The auction for <strong>${item.title}</strong> has officially ended.</p>
          <p>Unfortunately, you did not place the highest bid this time.</p>
          
          <ul style="background: #f9fafb; padding: 15px 20px; border-radius: 8px; list-style: none; margin: 20px 0; border: 1px solid #e2e8f0;">
            <li style="margin-bottom: 5px; color: #475569;"><strong>Final Price:</strong> $${winningBid.amount}</li>
            <li style="color: #475569;"><strong>Winner:</strong> ${winningBid.bidder.name}</li>
          </ul>

          <p>Don't worry! There are plenty more items waiting for you.</p>
        `;

        // Added inline styles for the button
        const actionBtn = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/market" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Browse More Items</a>`;

        html = getStyledHtml('Auction Ended', content, actionBtn);
      }

      await sendEmail(bidder.email, subject, text, html);
    }
    
    // console.log(`Auction emails successfully sent for item: ${item._id}`);
  } catch (error) {
    console.error('Error sending auction emails:', error);
  }
};

// Helper: Send Email when item goes UNSOLD
const sendUnsoldEmail = async (item) => {
  try {
    // Populate seller to get their email
    await item.populate('seller');
    
    if (!item.seller || !item.seller.email) return;

    const subject = `Auction Ended (Unsold) - ${item.title}`;
    const text = `Your auction for ${item.title} has ended without any bids.`;
    
    const content = `
      <p>Hello <strong>${item.seller.name}</strong>,</p>
      <p>Your auction for <strong>${item.title}</strong> has officially ended.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
         <p style="margin:0; font-size: 16px; font-weight: bold; color: #64748b;">No Bids Received</p>
      </div>

      <p>Unfortunately, your item did not receive any bids this time.</p>
      <p>Don't be discouraged! Items often sell faster when relisted with a slightly lower starting price, or by adding more high-quality photos and details to the description.</p>
    `;

    const actionBtn = `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-items" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Manage My Items</a>`;
    
    const html = getStyledHtml('Auction Ended', content, actionBtn);
    
    await sendEmail(item.seller.email, subject, text, html);
    // console.log(`Unsold email sent to seller for item: ${item._id}`);
  } catch (error) {
    console.error('❌ Error sending unsold email:', error);
  }
};

// 3. Central Status Checker
const getComputedStatus = (item) => {
  // Direct selling items: no time-based logic
  if (item.listingType === 'direct') {
    if (item.status === 'out_of_stock' || item.stock === 0) return 'out_of_stock';
    return 'available';
  }
  // Auction items: time-based logic
  if (['sold', 'closed', 'expired', 'paid'].includes(item.status)) return item.status;
  const now = new Date();
  const launch = new Date(item.launchTime || item.createdAt);
  const end = new Date(item.endTime);
  if (now < launch) return 'upcoming';
  if (now < end) return 'active';
  return 'ended';
};

const checkAndProcessAuctionStatus = async (item, io) => {
  const now = new Date();
  const launch = new Date(item.launchTime || item.createdAt);
  const end = new Date(item.endTime);
  let updated = false;

  // A. START: Upcoming -> Active
  if (item.status === 'upcoming' && now >= launch) {
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

      // Real-time notification: Item Sold
      if (io) {
        io.emit('auction_ended', {
          itemId: item._id,
          status: 'sold',
          winner: highestBid.bidder,
          finalPrice: highestBid.amount
        });
      }

      // Send emails (fire-and-forget)
      sendAuctionResultEmails(item, highestBid).catch(err => 
        console.error('Email sending failed:', err)
      );
    } else {
      item.status = 'expired';
      updated = true;
      
      // Real-time notification: Item Expired
      if (io) {
        io.emit('auction_ended', {
          itemId: item._id,
          status: 'expired',
          winner: null,
          finalPrice: item.currentBid
        });
      }

      // Send the unsold notification to the seller
      sendUnsoldEmail(item).catch(err => 
        console.error('Unsold Email sending failed:', err)
      );
    }
  }

  if (updated) await item.save();
};

// --- CONTROLLER METHODS (Standard methods) ---

exports.addItem = async (req, res) => {
  try {
    const { 
      title, description, category, basePrice, 
      auctionDuration, customEndTime, scheduleType, customStartTime,
      listingType, price, stock
    } = req.body;
    
    let imageUrls = [];
    if (req.files && req.files.length > 0) imageUrls = req.files.map(file => file.path);

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // --- DIRECT SELLING ITEM ---
    if (listingType === 'direct') {
      if (!price || price <= 0) {
        return res.status(400).json({ message: 'Price is required for direct selling.' });
      }

      const item = await Item.create({
        seller: req.user._id,
        title, description, category,
        images: imageUrls,
        listingType: 'direct',
        price: parseFloat(price),
        stock: parseInt(stock) || 1,
        status: 'available'
      });

      await item.populate('seller', 'name email');
      const doc = item.toJSON();
      doc.status = getComputedStatus(item);
      return res.status(201).json(doc);
    }

    // --- AUCTION ITEM (existing logic) ---
    if (!basePrice) {
      return res.status(400).json({ message: 'Base price is required for auction.' });
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
      listingType: 'auction',
      basePrice, currentBid: basePrice,
      auctionDuration: finalDuration,
      launchTime: startTime,
      endTime,
      status
    });
    
    await item.populate('seller', 'name email');
    const doc = item.toJSON();
    doc.status = getComputedStatus(item);
    res.status(201).json(doc);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const { category, status, search, listingType, page = 1, limit = 12 } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (listingType && ['auction', 'direct'].includes(listingType)) {
      query.listingType = listingType;
    }

    let items = await Item.find(query)
      .populate('seller', 'name')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });

    if (status) {
        if (status === 'live' || status === 'active') items = items.filter(i => ['active', 'upcoming', 'available'].includes(getComputedStatus(i)));
        else if (status === 'ended') items = items.filter(i => ['sold', 'closed', 'expired', 'ended', 'out_of_stock'].includes(getComputedStatus(i)));
        else items = items.filter(i => getComputedStatus(i) === status);
    } else {
        items = items.filter(i => ['active', 'upcoming', 'available'].includes(getComputedStatus(i)));
    }

    const compiledItems = items.map(i => {
      const doc = i.toJSON();
      doc.status = getComputedStatus(i);
      return doc;
    });

    const total = compiledItems.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = compiledItems.slice(startIndex, startIndex + parseInt(limit));
    
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
    const doc = item.toJSON();
    doc.status = getComputedStatus(item);
    res.json(doc);
  } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user._id })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    const compiledItems = items.map(i => {
      const doc = i.toJSON();
      doc.status = getComputedStatus(i);
      return doc;
    });
    res.json(compiledItems);
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


// At the bottom of your itemController.js file
exports.checkAndProcessAuctionStatus = checkAndProcessAuctionStatus;