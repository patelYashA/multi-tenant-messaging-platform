# Multi-Tenant Messaging API

A REST API built with Node.js, Express, PostgreSQL and Prisma.

## Features

- Create and retrieve messages
- Multi-tenant data isolation
- Message status tracking
- Idempotent provider webhooks
- Out-of-order event handling
- Cursor-based conversation pagination
- Request validation
- PostgreSQL persistence
- Automated API tests
- Docker Compose database setup

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Zod
- Jest
- Supertest
- Docker

## Requirements

- Node.js 18+
- Docker
- npm

## Installation

Clone the repository and install dependencies:

    npm install

Create your environment file:

    cp .env.example .env

Start PostgreSQL:

    docker compose up -d

Generate Prisma Client:

    npx prisma generate

Run database migrations:

    npx prisma migrate dev --name init

Start development server:

    npm run dev

Server runs at:

    http://localhost:3000

## API Endpoints

### Health

GET /health

### Create Message

POST /api/v1/messages

Header:

    x-tenant-id: tenant-a

Request:

    {
      "tenantId": "tenant-a",
      "conversationId": "conv-100",
      "to": "+919876543210",
      "text": "Your order has shipped"
    }

### Get Conversation Messages

GET /api/v1/conversations/conv-100/messages?limit=20

Header:

    x-tenant-id: tenant-a

For the next page, pass the returned nextCursor:

    GET /api/v1/conversations/conv-100/messages?limit=20&cursor=MESSAGE_ID

### Get Message

GET /api/v1/messages/MESSAGE_ID

Header:

    x-tenant-id: tenant-a

### Provider Webhook

POST /api/v1/webhooks/provider

Request:

    {
      "eventId": "evt-001",
      "messageId": "MESSAGE_ID",
      "status": "DELIVERED",
      "occurredAt": "2026-10-16T08:30:00.000Z"
    }

## Tenant Isolation

The x-tenant-id header represents the authenticated tenant for this
assignment. All tenant-scoped message queries filter by this value.

In production, this header must be populated by trusted authentication
middleware, not accepted directly from an untrusted client.

## Idempotency

Every provider event has a unique eventId. The database enforces
uniqueness so repeated event IDs cannot be processed twice.

The webhook event and message status update are handled in a
database transaction.

## Status Transition Rules

Normal progression:

QUEUED -> SENT -> DELIVERED -> READ

FAILED can be applied from any non-terminal state.

READ and FAILED are treated as terminal states.

Older events and backward transitions are recorded but do not
change the current message status.

## Pagination

Messages are returned in chronological order using createdAt and id
as stable ordering fields. The API uses cursor-based pagination.

## Tests

Run:

    npm test

Tests use the configured PostgreSQL database.

## Limitations and Production Considerations

- The x-tenant-id header is an assignment-level authentication
  assumption, not production authentication.
- The provider webhook is processed synchronously.
- A production system should consider a durable message broker,
  retry/backoff, dead-letter handling and webhook signature verification.
- Production deployments should add rate limiting, monitoring,
  metrics and stronger authorization.