# Webhook Integration Guide

This guide provides detailed instructions for integrating external systems with the Chatbots Platform using webhooks. Webhooks allow your applications to receive real-time notifications when specific events occur within the platform.

## Table of Contents

1. [Introduction to Webhooks](#introduction-to-webhooks)
2. [Available Events](#available-events)
3. [Setting Up Webhooks](#setting-up-webhooks)
4. [Webhook Payload Format](#webhook-payload-format)
5. [Security and Authentication](#security-and-authentication)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Code Examples](#code-examples)

## Introduction to Webhooks

Webhooks are HTTP callbacks that allow the Chatbots Platform to notify your application when specific events occur. Instead of continuously polling the API for updates, your application can receive push notifications in real-time.

### Key Benefits

- **Real-time Updates**: Receive notifications immediately when events occur
- **Reduced API Load**: Eliminate the need for frequent polling
- **Event-driven Architecture**: Build responsive, event-driven applications
- **Seamless Integration**: Connect the Chatbots Platform with your existing systems

## Available Events

The Chatbots Platform supports the following webhook events:

### Conversation Events

| Event | Description |
|-------|-------------|
| `conversation.created` | A new conversation is created |
| `conversation.updated` | A conversation is updated |
| `conversation.deleted` | A conversation is deleted |

### Message Events

| Event | Description |
|-------|-------------|
| `message.created` | A new message is sent |
| `message.updated` | A message is updated |
| `message.deleted` | A message is deleted |

### Chatbot Events

| Event | Description |
|-------|-------------|
| `chatbot.created` | A new chatbot is created |
| `chatbot.updated` | A chatbot is updated |
| `chatbot.deleted` | A chatbot is deleted |
| `chatbot.trained` | A chatbot completes training |
| `chatbot.deployed` | A chatbot is deployed |

### User Events

| Event | Description |
|-------|-------------|
| `user.created` | A new user is created |
| `user.updated` | A user profile is updated |
| `user.deleted` | A user is deleted |
| `user.login` | A user logs in |
| `user.logout` | A user logs out |

## Setting Up Webhooks

### Prerequisites

- A publicly accessible HTTPS endpoint to receive webhook events
- An account with the Chatbots Platform with API access

### Creating a Webhook

1. **Using the Dashboard**

   a. Navigate to the Integrations section in the dashboard
   b. Click "Add Webhook"
   c. Fill in the required information:
      - Name: A descriptive name for your webhook
      - URL: The HTTPS endpoint that will receive events
      - Events: Select the events you want to subscribe to
      - Description (optional): Additional information about the webhook
   d. Click "Create Webhook"

2. **Using the API**

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "name": "My Application Webhook",
  "url": "https://example.com/webhooks/chatbots",
  "description": "Webhook for receiving conversation events",
  "events": ["conversation.created", "message.created"],
  "active": true
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "My Application Webhook",
    "url": "https://example.com/webhooks/chatbots",
    "description": "Webhook for receiving conversation events",
    "events": ["conversation.created", "message.created"],
    "secret": "5f8d7a3c9b2e1d6f4a7c8b9d0e3f2a1",
    "active": true,
    "createdBy": "60d21b4667d0d8992e610c85",
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z"
  }
}
```

### Managing Webhooks

- **List Webhooks**

```http
GET /api/webhooks
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- **Get Webhook Details**

```http
GET /api/webhooks/60d21b4667d0d8992e610c85
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- **Update Webhook**

```http
PUT /api/webhooks/60d21b4667d0d8992e610c85
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "events": ["conversation.created", "message.created", "message.updated"],
  "active": true
}
```

- **Delete Webhook**

```http
DELETE /api/webhooks/60d21b4667d0d8992e610c85
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- **Regenerate Webhook Secret**

```http
POST /api/webhooks/60d21b4667d0d8992e610c85/regenerate-secret
Authorization: Bearer YOUR_ACCESS_TOKEN
```

- **Test Webhook**

```http
POST /api/webhooks/60d21b4667d0d8992e610c85/test
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Webhook Payload Format

When an event occurs, the Chatbots Platform sends an HTTP POST request to your webhook URL with the following payload format:

```json
{
  "event": "message.created",
  "timestamp": "2023-05-01T12:00:00Z",
  "data": {
    // Event-specific data
  }
}
```

### Example Payloads

#### Conversation Created

```json
{
  "event": "conversation.created",
  "timestamp": "2023-05-01T12:00:00Z",
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "title": "Support Request",
    "participants": ["user123", "bot456"],
    "metadata": {
      "source": "website",
      "referrer": "contact-page"
    },
    "createdAt": "2023-05-01T12:00:00Z"
  }
}
```

#### Message Created

```json
{
  "event": "message.created",
  "timestamp": "2023-05-01T12:05:00Z",
  "data": {
    "id": "60d21b4667d0d8992e610c86",
    "conversationId": "60d21b4667d0d8992e610c85",
    "sender": {
      "id": "user123",
      "type": "user"
    },
    "content": {
      "type": "text",
      "text": "Hello, I need help with my account."
    },
    "metadata": {
      "source": "web-client",
      "clientInfo": {
        "browser": "Chrome",
        "os": "Windows"
      }
    },
    "createdAt": "2023-05-01T12:05:00Z"
  }
}
```

#### Chatbot Trained

```json
{
  "event": "chatbot.trained",
  "timestamp": "2023-05-01T13:00:00Z",
  "data": {
    "id": "60d21b4667d0d8992e610c87",
    "name": "Customer Support Bot",
    "version": "1.2.0",
    "training": {
      "startedAt": "2023-05-01T12:30:00Z",
      "completedAt": "2023-05-01T13:00:00Z",
      "status": "success",
      "metrics": {
        "accuracy": 0.92,
        "f1Score": 0.89,
        "precision": 0.91,
        "recall": 0.88
      }
    }
  }
}
```

## Security and Authentication

### Webhook Signatures

To verify that webhook requests are coming from the Chatbots Platform, each request includes a signature in the `X-Chatbots-Signature` header. The signature is created using HMAC-SHA256 with your webhook secret.

#### Verifying Signatures

**Node.js Example:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

// In your webhook handler
app.post('/webhooks/chatbots', (req, res) => {
  const signature = req.headers['x-chatbots-signature'];
  const payload = req.body;
  const secret = 'your_webhook_secret';
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook event
  console.log(`Received event: ${payload.event}`);
  
  res.status(200).send('Webhook received');
});
```

**Python Example:**

```python
import hmac
import hashlib
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks/chatbots', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Chatbots-Signature')
    payload = request.json
    secret = 'your_webhook_secret'
    
    # Verify signature
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Process the webhook event
    print(f"Received event: {payload['event']}")
    
    return jsonify({'status': 'success'}), 200
```

### Additional Security Headers

Each webhook request includes the following headers:

- `X-Chatbots-Event`: The type of event being delivered
- `X-Chatbots-Delivery`: A unique ID for the delivery attempt

## Best Practices

### Webhook Implementation

1. **Respond Quickly**: Return a 2xx response as soon as possible (ideally within 5 seconds)
2. **Process Asynchronously**: Handle time-consuming operations outside the request-response cycle
3. **Implement Idempotency**: Handle duplicate deliveries gracefully
4. **Log All Events**: Keep a record of all received webhooks for debugging
5. **Verify Signatures**: Always validate the webhook signature before processing

### Webhook Management

1. **Use Descriptive Names**: Give webhooks clear names that indicate their purpose
2. **Subscribe to Specific Events**: Only subscribe to events you need
3. **Monitor Webhook Health**: Track success and failure rates
4. **Implement Proper Error Handling**: Handle and log webhook processing errors
5. **Use Webhook Filtering**: Filter events based on specific conditions to reduce noise

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Verify the webhook is active in the dashboard
   - Check that you're subscribed to the correct events
   - Ensure your endpoint is publicly accessible
   - Check your server logs for errors

2. **Signature Verification Failures**
   - Confirm you're using the correct webhook secret
   - Ensure you're calculating the signature correctly
   - Check for whitespace or formatting issues in the payload

3. **Timeout Issues**
   - Optimize your webhook handler to respond quickly
   - Process events asynchronously
   - Increase your server's timeout settings

### Debugging Tools

1. **Webhook Logs**: View webhook delivery attempts in the dashboard
2. **Test Endpoint**: Use the test feature to send a sample event
3. **Request Bin Services**: Use services like RequestBin or Webhook.site to inspect payloads

## Code Examples

### Node.js (Express)

```javascript
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifySignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

app.post('/webhooks/chatbots', (req, res) => {
  const signature = req.headers['x-chatbots-signature'];
  
  // Verify signature
  if (!verifySignature(req.body, signature)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  // Respond immediately
  res.status(200).send('Webhook received');
  
  // Process the event asynchronously
  const { event, data } = req.body;
  
  setImmediate(() => {
    try {
      console.log(`Processing ${event} event`);
      
      switch (event) {
        case 'conversation.created':
          handleNewConversation(data);
          break;
        case 'message.created':
          handleNewMessage(data);
          break;
        // Handle other events
        default:
          console.log(`Unhandled event type: ${event}`);
      }
    } catch (error) {
      console.error(`Error processing webhook: ${error.message}`);
    }
  });
});

function handleNewConversation(data) {
  // Implementation
  console.log(`New conversation: ${data.id}`);
}

function handleNewMessage(data) {
  // Implementation
  console.log(`New message in conversation ${data.conversationId}: ${data.content.text}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
```

### Python (Flask)

```python
import hmac
import hashlib
import json
import os
from flask import Flask, request, jsonify
from threading import Thread

app = Flask(__name__)

WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET')

def verify_signature(payload, signature):
    expected_signature = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

def process_event(event_type, data):
    print(f"Processing {event_type} event")
    
    if event_type == 'conversation.created':
        handle_new_conversation(data)
    elif event_type == 'message.created':
        handle_new_message(data)
    # Handle other events
    else:
        print(f"Unhandled event type: {event_type}")

def handle_new_conversation(data):
    # Implementation
    print(f"New conversation: {data['id']}")

def handle_new_message(data):
    # Implementation
    print(f"New message in conversation {data['conversationId']}: {data['content']['text']}")

@app.route('/webhooks/chatbots', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Chatbots-Signature')
    payload = request.json
    
    # Verify signature
    if not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Respond immediately
    response = jsonify({'status': 'success'})
    
    # Process the event asynchronously
    event_type = payload['event']
    data = payload['data']
    
    Thread(target=process_event, args=(event_type, data)).start()
    
    return response, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

### PHP

```php
<?php
// webhook.php

// Get the webhook payload
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Get the signature from the headers
$signature = $_SERVER['HTTP_X_CHATBOTS_SIGNATURE'] ?? '';
$webhookSecret = getenv('WEBHOOK_SECRET');

// Verify the signature
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Respond immediately
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['status' => 'success']);

// Flush the output buffer to send the response
ob_flush();
flush();

// Process the event asynchronously
$eventType = $data['event'];
$eventData = $data['data'];

// Log the event
error_log("Received webhook event: {$eventType}");

// Process based on event type
switch ($eventType) {
    case 'conversation.created':
        handleNewConversation($eventData);
        break;
    case 'message.created':
        handleNewMessage($eventData);
        break;
    // Handle other events
    default:
        error_log("Unhandled event type: {$eventType}");
}

function handleNewConversation($data) {
    // Implementation
    error_log("New conversation: {$data['id']}");
}

function handleNewMessage($data) {
    // Implementation
    error_log("New message in conversation {$data['conversationId']}: {$data['content']['text']}");
}
?>
```

## Conclusion

Webhooks provide a powerful way to integrate the Chatbots Platform with your existing systems and build real-time, event-driven applications. By following the guidelines in this document, you can implement secure, reliable webhook integrations that enhance your application's capabilities.

For additional support, please refer to the [API Documentation](API_DOCUMENTATION.md) or contact our support team at support@example.com.
