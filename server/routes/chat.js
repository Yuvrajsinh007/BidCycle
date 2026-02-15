const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendMessage, getMessages } = require('../controllers/chatController');

router.post('/', protect, upload.single('file'), sendMessage);
router.get('/:itemId', protect, getMessages);

module.exports = router;