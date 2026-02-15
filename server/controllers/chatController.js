const Message = require('../models/Message');
const User = require('../models/User');

// Send a Message
exports.sendMessage = async (req, res) => {
    try {
      const { itemId, receiverId, content, type, lat, lng } = req.body;
      const senderId = req.user._id;
      const io = req.app.get('io');
  
      let mediaUrl = null;
      
      // If a file was uploaded via middleware
      if (req.file) {
        mediaUrl = req.file.path; // Assuming Cloudinary or Local storage path
      }
  
      // Construct Location object if type is location
      let locationData = null;
      if (type === 'location' && lat && lng) {
        locationData = { lat, lng };
      }
  
      const message = await Message.create({
        item: itemId,
        sender: senderId,
        receiver: receiverId,
        content: content || '', // Content might be empty for images
        type: type || 'text',
        mediaUrl: mediaUrl,
        location: locationData
      });
  
      await message.populate('sender', 'name profilePic');
      await message.populate('receiver', 'name profilePic');
  
      // Real-time Emit
      io.to(`chat_${itemId}`).emit('receive_message', message);
  
      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
};

// Get Conversation History for an Item
exports.getMessages = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Find messages where user is either sender or receiver for this item
    const messages = await Message.find({
      item: itemId,
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate('sender', 'name profilePic')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};