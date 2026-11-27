const express = require('express');
const router = express.Router();

const messageController = require('../controllers/message.controller');

router.post('/messages', messageController.createMessage);

router.get(
  '/conversations/:conversationId/messages',
  messageController.getConversationMessages
);

router.get('/messages/:messageId', messageController.getMessage);

module.exports = router;