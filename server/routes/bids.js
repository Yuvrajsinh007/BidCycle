const express = require('express');
const router = express.Router();
const { placeBid, getMyBids, getWonAuctions, getActiveBids } = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

router.post('/:id', protect, placeBid);
router.get('/my-bids', protect, getMyBids);
router.get('/won-auctions', protect, getWonAuctions);
router.get('/active-bids', protect, getActiveBids);

module.exports = router;
