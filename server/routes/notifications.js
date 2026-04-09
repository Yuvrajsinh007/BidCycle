const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    getNotifications, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications 
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, clearAllNotifications);

module.exports = router;
