Notification System

An asynchronous notification system built with Node.js, Express.js, Redis, RabbitMQ, and MongoDB.

The main goal is to process notifications in the background instead of making the API wait for the complete notification process.

Workflow

<p align="center">
  <img src="./workflow.gif" alt="Notification System Workflow" width="100%">
</p>System Flow

Client
   │
   ▼
 API
   │
   ▼
Redis
   │
   ▼
RabbitMQ
   │
   ▼
Worker
   │
   ▼
Email Service
   │
   ▼
MongoDB

Retry Flow

Worker
   │
   ├── Success ──────────────► MongoDB
   │
   └── Failure
          │
          ▼
      RabbitMQ
          │
          ▼
        Worker
          │
          └── Retry up to 3 times

---

How It Works

1. Client → API

The client sends a notification request to the API.

The API receives the request and prepares it for background processing.

2. API → Redis

Redis performs two checks before the job is created:

- Rate limiting — limits requests to 5 per minute.
- Deduplication — prevents duplicate notification requests.

If the request passes these checks, it continues to RabbitMQ.

3. Redis → RabbitMQ

The API publishes the notification job to the RabbitMQ "notifications" queue.

The API does not wait for the notification to be delivered.

This keeps the API response fast.

4. RabbitMQ → Worker

The worker continuously listens to the notification queue.

When a job arrives, the worker consumes it and tries to send the notification.

5. Worker → MongoDB

If the notification is successfully sent:

Worker
   ↓
Success
   ↓
MongoDB
   ↓
SUCCESS

The RabbitMQ message is then acknowledged.

6. Failure & Retry

If notification delivery fails, the worker increases the retry count and sends the job back to RabbitMQ.

Worker
   ↓
Failure
   ↓
RabbitMQ
   ↓
Worker

The job can be retried up to 3 times.

If all retries fail:

Worker
   ↓
Retry limit reached
   ↓
MongoDB
   ↓
FAILED

---

Architecture

Component| Responsibility
Client| Sends notification requests
API| Receives requests and creates jobs
Redis| Rate limiting and deduplication
RabbitMQ| Message queue and retry handling
Worker| Processes notification jobs
Email Service| Sends notifications
MongoDB| Stores notification results

---

Why This Architecture?

The system separates API request handling from notification processing.

Instead of:

Client → API → Send Email → Response

the system uses:

Client → API → RabbitMQ
                 ↓
               Worker
                 ↓
              Send Email

This allows the API to respond quickly while the worker processes the notification in the background.

Benefits

- Asynchronous processing
- Faster API response
- Retry handling
- Duplicate protection
- Rate limiting
- Background workers
- Notification status tracking

---

Tech Stack

- Node.js
- Express.js
- Redis
- RabbitMQ
- MongoDB

---

Project Structure

notification-system/
│
├── api/
│   └── API Service
│
├── worker/
│   └── Worker Service
│
├── workflow.gif
│
└── README.md

---

Core Idea

«The API accepts the request, Redis validates it, RabbitMQ queues it, the worker processes it, and MongoDB stores the result.»

The queue and worker architecture keeps notification processing asynchronous and provides a simple retry mechanism for failed jobs.