const { Prisma } = require("@prisma/client");
const { prisma } = require("./message.service");

const MAX_RETRIES = 3;

const statusOrder = {
  QUEUED: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
};

const timestampFields = {
  SENT: "sentAt",
  DELIVERED: "deliveredAt",
  READ: "readAt",
  FAILED: "failedAt",
};

const terminalStatuses = new Set([
  "READ",
  "FAILED",
]);

const validStatuses = new Set([
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
]);

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const processWebhook = async (data) => {
  const occurredAt = new Date(data.occurredAt);

  // Defensive status validation
  if (!validStatuses.has(data.status)) {
    throw createError("Invalid webhook status", 400);
  }

  // Defensive timestamp validation
  if (Number.isNaN(occurredAt.getTime())) {
    throw createError("Invalid occurredAt timestamp", 400);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Check whether the event was already processed
          const existingEvent = await tx.webhookEvent.findUnique({
            where: {
              eventId: data.eventId,
            },
          });

          if (existingEvent) {
            return {
              duplicate: true,
              applied: false,
            };
          }

          // Find the associated message
          const message = await tx.message.findUnique({
            where: {
              id: data.messageId,
            },
          });

          if (!message) {
            throw createError("Message not found", 404);
          }

          // Persist the webhook event
          await tx.webhookEvent.create({
            data: {
              eventId: data.eventId,
              messageId: data.messageId,
              status: data.status,
              occurredAt,
            },
          });

          const currentStatus = message.status;
          const incomingStatus = data.status;

          // Do not modify terminal states
          if (terminalStatuses.has(currentStatus)) {
            return {
              duplicate: false,
              applied: false,
              message,
            };
          }

          // Ignore events older than the current status timestamp
          const currentTimestampField =
            timestampFields[currentStatus];

          if (
            currentTimestampField &&
            message[currentTimestampField] &&
            occurredAt < message[currentTimestampField]
          ) {
            return {
              duplicate: false,
              applied: false,
              message,
            };
          }

          // FAILED is allowed from any non-terminal state
          if (incomingStatus === "FAILED") {
            const updatedMessage = await tx.message.update({
              where: {
                id: message.id,
              },
              data: {
                status: "FAILED",
                failedAt: occurredAt,
              },
            });

            return {
              duplicate: false,
              applied: true,
              message: updatedMessage,
            };
          }

          // Ignore duplicate statuses and backward transitions
          if (
            statusOrder[incomingStatus] <=
            statusOrder[currentStatus]
          ) {
            return {
              duplicate: false,
              applied: false,
              message,
            };
          }

          // Apply forward status progression
          const timestampField =
            timestampFields[incomingStatus];

          const updatedMessage = await tx.message.update({
            where: {
              id: message.id,
            },
            data: {
              status: incomingStatus,
              [timestampField]: occurredAt,
            },
          });

          return {
            duplicate: false,
            applied: true,
            message: updatedMessage,
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      // Handle concurrent duplicate webhook insertion
      if (error.code === "P2002") {
        const existingEvent =
          await prisma.webhookEvent.findUnique({
            where: {
              eventId: data.eventId,
            },
          });

        if (existingEvent) {
          return {
            duplicate: true,
            applied: false,
          };
        }
      }

      // Retry transaction conflicts or deadlocks
      if (error.code === "P2034") {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * attempt)
          );

          continue;
        }

        throw createError(
          "Concurrent update conflict. Please retry.",
          503
        );
      }

      throw error;
    }
  }
};

module.exports = {
  processWebhook,
};