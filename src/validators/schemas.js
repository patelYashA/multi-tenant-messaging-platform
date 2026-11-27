const { z } = require("zod");

const createMessageSchema = z.object({
  tenantId: z.string().min(1).max(100),
  conversationId: z.string().min(1).max(100),
  to: z.string().min(3).max(30),
  text: z.string().min(1).max(5000)
});

const webhookSchema = z.object({
  eventId: z.string().min(1).max(150),
  messageId: z.string().min(1).max(100),
  status: z.enum(["SENT", "DELIVERED", "READ", "FAILED"]),
  occurredAt: z.string().datetime({ offset: true })
});

const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
});

module.exports = {
  createMessageSchema,
  webhookSchema,
  listMessagesQuerySchema
};