const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/ban', adminController.toggleUserBan);
router.put('/users/:userId/role', adminController.updateUserRole);

// Item management
router.get('/items', adminController.getAllItems);
router.delete('/items/:itemId', adminController.deleteItem);

// Bid management
router.get('/bids', adminController.getAllBids);
router.delete('/bids/:bidId', adminController.deleteBid);

module.exports = router;

