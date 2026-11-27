const express = require('express');
const router = express.Router();

const webhookController = require('../controllers/webhook.controller');

router.post('/provider', webhookController.handleProviderWebhook);

module.exports = router;