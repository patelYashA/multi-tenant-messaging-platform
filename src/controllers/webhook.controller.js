const webhookService = require('../services/webhook.service');
const { webhookSchema } = require('../validators/schemas');

const handleProviderWebhook = async (req, res, next) => {
  try {
    const validatedData = webhookSchema.parse(req.body);

    const result = await webhookService.processWebhook(validatedData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleProviderWebhook,
};