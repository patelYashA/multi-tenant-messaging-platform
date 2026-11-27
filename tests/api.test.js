const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const app = require("../src/app");

const prisma = new PrismaClient();

describe("Messaging API", () => {
  const tenantId = `test-tenant-${Date.now()}`;
  let messageId;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.webhookEvent.deleteMany({
      where: {
        message: {
          tenantId
        }
      }
    });

    await prisma.message.deleteMany({
      where: { tenantId }
    });

    await prisma.conversation.deleteMany({
      where: { tenantId }
    });

    await prisma.$disconnect();
  });

  test("should create a message with QUEUED status", async () => {
    const response = await request(app)
      .post("/api/v1/messages")
      .set("x-tenant-id", tenantId)
      .send({
        tenantId,
        conversationId: "conversation-1",
        to: "+919876543210",
        text: "Your order has shipped"
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("QUEUED");

    messageId = response.body.data.id;
  });

  test("should reject requests without tenant header", async () => {
    const response = await request(app)
      .post("/api/v1/messages")
      .send({
        tenantId,
        conversationId: "conversation-2",
        to: "+919876543210",
        text: "Hello"
      });

    expect(response.status).toBe(400);
  });

  test("should process a delivery webhook", async () => {
    const response = await request(app)
      .post("/api/v1/webhooks/provider")
      .send({
        eventId: `event-${Date.now()}`,
        messageId,
        status: "DELIVERED",
        occurredAt: new Date().toISOString()
      });

    expect(response.status).toBe(200);
    expect(response.body.applied).toBe(true);
  });

  test("should not expose another tenant's message", async () => {
    const response = await request(app)
      .get(`/api/v1/messages/${messageId}`)
      .set("x-tenant-id", "another-tenant");

    expect(response.status).toBe(404);
  });

  test("should return health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });
});