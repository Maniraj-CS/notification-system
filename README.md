# About This Project

## API Service

This service acts as the entry point for notification requests.  
Before pushing messages to RabbitMQ, it applies **rate limiting** and **deduplication** using Redis.

---

### Redis Usage

#### 1️⃣ Rate Limiting

- Each user is allowed **maximum 5 requests per minute**
- Implemented using Redis `INCR` and `EXPIRE`
- If the limit is exceeded, the API returns **429 – Too Many Requests**

**Why Redis?**
- Fast in-memory operations
- Atomic increments
- Works well in distributed systems

---

#### 2️⃣ Deduplication

- Prevents the same user from sending the same message multiple times
- Uses a Redis key with expiration (10 minutes)
- Duplicate messages are ignored and not pushed to the queue

---

### RabbitMQ Usage

- After Redis checks pass, the API publishes the message to RabbitMQ
- Each message includes a `retry` field initialized to `0`
- The worker service handles delivery and retries asynchronously

---

### Flow Summary

1. Client sends notification request
2. Redis rate limit check
3. Redis deduplication check
4. Message pushed to RabbitMQ
5. Worker consumes and processes the message


## Worker Service

### Overview

This worker service is responsible for processing notification jobs from **RabbitMQ** and storing delivery logs in **MongoDB**.

It listens to the `notifications` queue, attempts to send emails, and ensures reliable processing using retries and acknowledgements.

---

### How It Works

1. The worker consumes messages from the RabbitMQ queue.
2. Each message contains:
   - `userId`
   - `email`
   - `message`
   - `retry` count
3. The worker attempts to send the email.

---

### Success Flow

- If the email is sent successfully:
  - The message details are saved in MongoDB with status **`SUCCESS`**
  - The message is acknowledged (`ack`) and removed from the queue

---

### Failure & Retry Flow

- If email sending fails:
  - The worker increments the retry count
  - If retry count is **less than or equal to 3**:
    - The job is re-published to the queue
    - The current message is acknowledged
  - If retry count **exceeds 3**:
    - The job is saved in MongoDB with status **`FAILED`**
    - The message is acknowledged and permanently removed from the queue

---

### Why Acknowledgement (`ack`) Is Important

- Prevents duplicate message processing
- Ensures messages are removed only after successful handling
- Avoids infinite reprocessing loops

---

### Technologies Used

- **Node.js** – Runtime environment for API and worker services  
- **Express.js** – HTTP API for producing notification jobs  
- **RabbitMQ** – Message queue for asynchronous job processing and retries  
- **Redis** – Rate limiting and message deduplication at the API layer  
- **MongoDB** – Persistent storage for notification delivery logs  

---

## MIT License

Copyright (c) 2026 Maniraj Pandit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

