const Notification = require('../models/Notification');
const { sendEmail, getStyledHtml } = require('../utils/emailService');

// Fetch user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedItem', 'title images')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notifications as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Utility to dispatch notification & email
exports.dispatchNotification = async ({ userId, userEmail, type, message, relatedItemId, subject }) => {
  try {
    // 1. Create In-App Notification
    await Notification.create({
      user: userId,
      type,
      message,
      relatedItem: relatedItemId
    });

    // 2. Dispatch Email
    if (userEmail) {
      const html = getStyledHtml(subject, `<p>${message}</p>`);
      await sendEmail(userEmail, subject, message, html);
    }
  } catch (error) {
    console.error('Dispatch notification error:', error);
  }
};
