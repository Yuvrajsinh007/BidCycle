const express = require('express');
const router = express.Router();
const { buyNow, checkoutCart, getMyOrders, getSellerOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/checkout', checkoutCart);
router.post('/:itemId', buyNow);
router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders);
router.patch('/:orderId/status', updateOrderStatus);

module.exports = router;
