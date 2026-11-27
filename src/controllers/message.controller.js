const messageService = require('../services/message.service');
const {
  createMessageSchema,
  listMessagesQuerySchema,
} = require('../validators/schemas');

const createMessage = async (req, res, next) => {
  try {
    const validatedData = createMessageSchema.parse(req.body);

    const message = await messageService.createMessage(
      req.tenantId,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const query = listMessagesQuerySchema.parse(req.query);

    const result = await messageService.getConversationMessages(
      req.tenantId,
      req.params.conversationId,
      query
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMessage = async (req, res, next) => {
  try {
    const message = await messageService.getMessage(
      req.tenantId,
      req.params.messageId
    );

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMessage,
  getConversationMessages,
  getMessage,
};