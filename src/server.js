const app = require("./app");
const { PrismaClient } = require("@prisma/client");
const { port } = require("./config/env");

const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();