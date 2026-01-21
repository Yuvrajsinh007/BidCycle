const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const bidController = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

// --- 1. Specific Routes (MUST be defined before /:id) ---

// This was missing! It must use 'protect' so we know who the user is.
router.get('/my-items', protect, itemController.getMyItems);

// Public route to get all items
router.get('/', itemController.getAllItems);


// --- 2. Dynamic Routes (/:id) ---
// These capture anything that hasn't been matched above.
// If you put these at the top, they will "eat" the request for 'my-items'
router.get('/:id', itemController.getItemById);
router.get('/:id/bids', itemController.getItemBids);

// Protected dynamic routes
router.post('/:id/bid', protect, bidController.placeBid);

// (Optional) If you have edit/delete routes, they would go here too:
// router.put('/:id', protect, itemController.editItem);
// router.delete('/:id', protect, itemController.deleteItem);

module.exports = router;