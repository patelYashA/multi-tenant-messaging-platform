const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

const tenantMiddleware = require("./middleware/tenant");
const errorHandler = require("./middleware/errorHandler");

const messageRoutes = require("./routes/message.routes");
const webhookRoutes = require("./routes/webhook.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy"
  });
});

// Webhook provider is external and does not use the tenant header.
app.use('/api/v1/webhooks', webhookRoutes);

app.use('/api/v1', tenantMiddleware, messageRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use(errorHandler);

module.exports = app;