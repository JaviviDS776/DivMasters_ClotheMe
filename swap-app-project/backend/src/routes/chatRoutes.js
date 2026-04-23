const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/conversations', chatController.getConversations);
router.post('/conversation', chatController.getOrCreateConversation);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/message', chatController.sendMessage);

module.exports = router;
