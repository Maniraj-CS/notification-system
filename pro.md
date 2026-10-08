Notification System

A simple asynchronous notification system built with Node.js, Express, Redis, RabbitMQ, and MongoDB.

The main idea is to keep the API fast by moving notification processing to a background worker.

---

System Workflow

flowchart LR

    C[Client] -->|Notification Request| A[API Service]

    A -->|Rate Limit| R[(Redis)]
    R -->|Check Duplicate| R

    R -->|Request Valid| Q[RabbitMQ]

    Q -->|Consume Job| W[Worker Service]

    W -->|Send Email| E[Email Service]

    E -->|Success| M[(MongoDB)]

    E -->|Failure| W

    W -->|Retry ≤ 3| Q

    W -->|Retry > 3| F[(MongoDB - FAILED)]

    M --> C
    F --> C

    classDef client fill:#111827,stroke:#60a5fa,color:#fff
    classDef service fill:#172554,stroke:#38bdf8,color:#fff
    classDef queue fill:#3f1d0b,stroke:#fb923c,color:#fff
    classDef database fill:#052e16,stroke:#4ade80,color:#fff
    classDef email fill:#312e81,stroke:#a78bfa,color:#fff

    class C client
    class A,W service
    class Q queue
    class R,M,F database
    class E email

«Flow: Client → API → Redis → RabbitMQ → Worker → Email → MongoDB»

If notification delivery fails, the worker sends the job back to RabbitMQ for retry.

---

How the System Works

1. Client Sends Request

The client sends a notification request to the API.

Client
  ↓
API

The API is responsible for accepting the request and preparing it for background processing.

---

2. Redis Checks the Request

Before creating a job, the API uses Redis for two checks:

- Rate limiting
- Duplicate message detection

The current rate limit is 5 requests per minute per user.

Duplicate messages are also blocked for a short period.

API
 ↓
Redis
 ├── Rate Limit
 └── Deduplication

---

3. RabbitMQ Creates the Queue

If the Redis checks pass, the API publishes the notification job to RabbitMQ.

The API does not wait for the email to be sent.

API
 ↓
RabbitMQ
 ↓
Notification Queue

This makes the API faster and separates request handling from notification processing.

---

4. Worker Processes the Job

The worker continuously listens to the "notifications" queue.

When a message arrives, the worker consumes it and tries to send the notification.

RabbitMQ
    ↓
  Worker
    ↓
 Send Email

The worker receives information such as:

- "userId"
- "email"
- "message"
- "retry"

---

Retry Flow

If notification delivery fails, the worker increases the retry count.

Worker
  ↓
Failed
  ↓
Retry?
  ↓
RabbitMQ
  ↓
Worker

The job can be retried up to 3 times.

If all retries fail:

Worker
  ↓
Failed after retries
  ↓
MongoDB
  ↓
FAILED

This prevents failed jobs from staying in an endless processing loop.

---

Success Flow

When the notification is successfully delivered:

Worker
  ↓
Email Sent
  ↓
MongoDB
  ↓
SUCCESS
  ↓
RabbitMQ ACK

The message is acknowledged and removed from the queue.

---

Components

Component| Responsibility
Client| Sends notification requests
API| Accepts requests and creates jobs
Redis| Rate limiting and deduplication
RabbitMQ| Stores and delivers background jobs
Worker| Processes notification jobs
Email Service| Sends the notification
MongoDB| Stores delivery results

---

Why This Architecture?

The system separates request handling from notification processing.

Instead of making the client wait for the notification to finish:

Client
  ↓
API
  ↓
Queue
  ↓
Worker

The API can return quickly while the worker processes the job in the background.

This approach also makes it easier to handle:

- High request traffic
- Temporary failures
- Retries
- Duplicate requests
- Background processing
- Delivery tracking

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
└── README.md

---

Core Flow

Client
  │
  ▼
API
  │
  ▼
Redis
  │
  ├── Rate Limit
  └── Deduplication
  │
  ▼
RabbitMQ
  │
  ▼
Worker
  │
  ├── Success ───────► MongoDB
  │
  └── Failure
          │
          ▼
      Retry Queue
          │
          └──────────► Worker

In short

API handles the request. Redis validates it. RabbitMQ stores the job. Worker processes it. MongoDB records the result.

The important part of this architecture is the queue + worker + retry loop, which allows notification processing to happen asynchronously.