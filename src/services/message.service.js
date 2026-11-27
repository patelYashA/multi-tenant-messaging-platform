const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Create message
const createMessage = async (tenantId, data) => {
  if (tenantId !== data.tenantId) {
    const error = new Error("Tenant ID mismatch");
    error.statusCode = 403;
    throw error;
  }

  return prisma.message.create({
    data: {
      to: data.to,
      text: data.text,
      status: "QUEUED",

      conversation: {
        connectOrCreate: {
          where: {
            tenantId_id: {
              tenantId,
              id: data.conversationId,
            },
          },
          create: {
            tenantId,
            id: data.conversationId,
          },
        },
      },
    },
  });
};

// Get conversation messages with cursor-based pagination
const getConversationMessages = async (
  tenantId,
  conversationId,
  { limit = 20, cursor } = {}
) => {
  const where = {
    tenantId,
    conversationId,
  };

  // Validate cursor
  if (cursor) {
    const cursorMessage = await prisma.message.findFirst({
      where: {
        id: cursor,
        tenantId,
        conversationId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!cursorMessage) {
      const error = new Error("Invalid pagination cursor");
      error.statusCode = 400;
      throw error;
    }

    // Fetch records after the cursor
    where.OR = [
      {
        createdAt: {
          gt: cursorMessage.createdAt,
        },
      },
      {
        createdAt: cursorMessage.createdAt,
        id: {
          gt: cursorMessage.id,
        },
      },
    ];
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
    take: limit + 1,
  });

  const hasMore = messages.length > limit;

  if (hasMore) {
    messages.pop();
  }

  const nextCursor = hasMore
    ? messages[messages.length - 1].id
    : null;

  return {
    messages,
    nextCursor,
    hasMore,
  };
};

// Get single message
const getMessage = async (tenantId, messageId) => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      tenantId,
    },
  });

  if (!message) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }

  return message;
};

module.exports = {
  prisma,
  createMessage,
  getConversationMessages,
  getMessage,
};