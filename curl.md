Here are the cURL commands for all five APIs in your messaging assignment, including edge-case testing.

Base URL: `http://localhost:3000`

You can directly import these cURL commands into Postman using **Import → Raw text**.

## **1. Health check**

```
curl --location 'http://localhost:3000/health'
```

Expected status: `200 OK`

## **2. Create message**

**POST&#x20;**`/api/v1/messages`

```
curl --location 'http://localhost:3000/api/v1/messages' \
--header 'Content-Type: application/json' \
--header 'x-tenant-id: tenant-1' \
--data '{
    "tenantId": "tenant-1",
    "conversationId": "conv-1",
    "to": "+919876543210",
    "text": "Hello, this is a test message."
}'
```

Expected status: `201 Created`

The message should be created with status `QUEUED`.

Copy the generated message ID from the response for subsequent requests.

## **3. Get message by ID**

**GET&#x20;**`/api/v1/messages/:messageId`

```
curl --location 'http://localhost:3000/api/v1/messages/MESSAGE_ID' \
--header 'x-tenant-id: tenant-1'
```

Expected status: `200 OK`

## **4. Get conversation messages**

**GET&#x20;**`/api/v1/conversations/:conversationId/messages`

```
curl --location 'http://localhost:3000/api/v1/conversations/conv-1/messages?limit=20' \
--header 'x-tenant-id: tenant-1'
```

### **With pagination cursor**

```
curl --location 'http://localhost:3000/api/v1/conversations/conv-1/messages?limit=2&cursor=CURSOR_VALUE' \
--header 'x-tenant-id: tenant-1'
```

Replace `CURSOR_VALUE` with the cursor returned by the previous response. Create multiple messages to test pagination.

## **5. Provider webhook**

**POST&#x20;**`/api/v1/webhooks/provider`

### **Update status to SENT**

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-001",
    "messageId": "MESSAGE_ID",
    "status": "SENT",
    "occurredAt": "2026-11-27T10:00:00.000Z"
}'
```

### **Update status to DELIVERED**

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-002",
    "messageId": "MESSAGE_ID",
    "status": "DELIVERED",
    "occurredAt": "2026-11-27T10:01:00.000Z"
}'
```

### **Update status to READ**

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-003",
    "messageId": "MESSAGE_ID",
    "status": "READ",
    "occurredAt": "2026-11-27T10:02:00.000Z"
}'
```

Expected status: `200 OK` for each webhook.

The expected message lifecycle is:

## **Edge-case testing**

These are particularly important for your assignment evaluation.

### **6. Duplicate webhook — idempotency**

Send the same event again.

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-003",
    "messageId": "MESSAGE_ID",
    "status": "READ",
    "occurredAt": "2026-11-27T10:02:00.000Z"
}'
```

Expected:

- `200 OK`
- No duplicate webhook event record.
- Message status remains unchanged.

### **7. Out-of-order webhook**

Send an older SENT event after the message has reached READ.

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-004",
    "messageId": "MESSAGE_ID",
    "status": "SENT",
    "occurredAt": "2026-11-27T09:59:00.000Z"
}'
```

Expected: Message status remains `READ`.

### **8. Tenant isolation**

Try accessing tenant-1's message using tenant-2.

```
curl --location 'http://localhost:3000/api/v1/messages/MESSAGE_ID' \
--header 'x-tenant-id: tenant-2'
```

Expected status: `404 Not Found`

### **9. Missing tenant header**

```
curl --location 'http://localhost:3000/api/v1/conversations/conv-1/messages'
```

Expected status: `400 Bad Request`

### **10. Invalid message payload**

```
curl --location 'http://localhost:3000/api/v1/messages' \
--header 'Content-Type: application/json' \
--header 'x-tenant-id: tenant-1' \
--data '{
    "tenantId": "tenant-1",
    "conversationId": "conv-1",
    "to": "",
    "text": ""
}'
```

Expected status: `400 Bad Request`

### **11. Tenant mismatch**

```
curl --location 'http://localhost:3000/api/v1/messages' \
--header 'Content-Type: application/json' \
--header 'x-tenant-id: tenant-1' \
--data '{
    "tenantId": "tenant-2",
    "conversationId": "conv-1",
    "to": "+919876543210",
    "text": "Unauthorized tenant message"
}'
```

Expected: Request rejected with a `4xx` response.

### **12. Unknown message webhook**

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-005",
    "messageId": "non-existing-message",
    "status": "DELIVERED",
    "occurredAt": "2026-11-27T10:03:00.000Z"
}'
```

Expected status: `404 Not Found`

### **13. Invalid webhook status**

```
curl --location 'http://localhost:3000/api/v1/webhooks/provider' \
--header 'Content-Type: application/json' \
--data '{
    "eventId": "event-006",
    "messageId": "MESSAGE_ID",
    "status": "INVALID_STATUS",
    "occurredAt": "2026-11-27T10:04:00.000Z"
}'
```

Expected status: `400 Bad Request`

## **Testing checklist**

## **Assignment testing progress**

0/18 passed

Health check

Create message with QUEUED status

Get message by ID

Get conversation messages

Cursor-based pagination

Webhook SENT status

Webhook DELIVERED status

Webhook READ status

Duplicate webhook idempotency

Out-of-order webhook protection

Tenant isolation

Missing tenant header

Invalid payload validation

Tenant mismatch

Unknown message webhook

Invalid webhook status

FAILED status transition on a separate message

Database persistence after server restart

Reset checklist

**Note:** Replace `MESSAGE_ID` with the actual generated ID. These commands use Bash-style cURL syntax, suitable for Postman import or Git Bash on Windows. The expected responses are based on our implementation design; they have not yet been verified against your running server.