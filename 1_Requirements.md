# Accommodation Service Requirements & Technical Specifications

## Technical Stack Overview

### Core Technologies
- **Framework:** NestJS (TypeScript)
- **Primary Database:** PostgreSQL (via Slonik) - All service/business data
- **Logging Database:** MongoDB - Async logging of program data
- **Cache & Sessions:** Redis - Session management and caching
- **Message Queue:** AWS SQS - Async task processing
- **Job Processing:** BullMQ - Email sending and background jobs
- **Authentication:** Session-based (stored in Redis)
- **Real-time Communication:**
  - WebSocket - User online/offline status
  - SSE (Server-Sent Events) - Payment completion notifications

---

## 1. User Management

### 1.1 Guest Access (Unregistered Users)
- Browse available accommodations without authentication
- View accommodation details (photos, amenities, pricing)
- View host profiles and reviews
- Search and filter accommodations
- Cannot make reservations or save favorites
- Prompted to sign up when attempting to book

### 1.2 User Registration & Authentication

#### Authentication Architecture
**Session-Based Authentication (Redis):**
- Sessions stored in Redis with TTL
- Session key structure: `session:{sessionId}`
- Session data includes: `userId`, `roles`, `lastActivity`, `ipAddress`
- Automatic session refresh on activity
- Session expiry: 7 days (configurable)
- Support for multiple concurrent sessions per user

**Sign-up Information:**
- **Required Fields:**
  - Email address (unique, verified)
  - Password (min 8 chars, complexity requirements)
  - Full name (first name, last name)
  - Phone number (with country code)
  - Date of birth (18+ age verification)

- **Optional Profile Information:**
  - Profile photo (stored in S3/CloudFront)
  - Preferred language (default: browser language)
  - Timezone (auto-detected, editable)
  - Country of residence
  - City
  - Bio/About me (max 500 chars)
  - Emergency contact

**Sign-up Flow:**
1. User submits registration form
2. Validation and password hashing (bcrypt)
3. Create user record in PostgreSQL
4. Send verification email (via BullMQ job → SQS → email service)
5. Generate verification token (stored in Redis with 24h TTL)
6. Send SMS OTP for phone verification (via BullMQ)
7. Create initial session in Redis upon verification
8. Trigger welcome flow (async via SQS)

**OAuth Integration:**
- Supported providers: Google, Facebook, Apple
- OAuth flow creates or links to existing account
- Session creation follows same Redis pattern

**Security Requirements:**
- Password hashing with bcrypt (salt rounds: 10)
- CSRF protection for session-based auth
- Rate limiting on authentication endpoints
- Failed login attempt tracking (Redis)
- Account lockout after 5 failed attempts (15-min lockout)
- Two-factor authentication (optional, via SMS/Authenticator)

### 1.3 User Roles

#### 1.3.1 Guest/Reserver Role
- Can search and book accommodations
- View booking history
- Write reviews for stayed accommodations
- Manage payment methods (tokenized in PostgreSQL)
- Communicate with hosts (WebSocket)
- Save favorite accommodations
- Receive booking confirmations and reminders (email via BullMQ)

#### 1.3.2 Host/Accommodator Role
- All guest privileges +
- List accommodations (multiple properties allowed)
- Set pricing and availability calendars
- Manage bookings and reservations
- Respond to guest inquiries (real-time via WebSocket)
- Access host dashboard with analytics
- Set house rules and cancellation policies
- Verify identity (government ID required, docs in S3)
- Provide payout account information

**Role Switching:**
- Users can have multiple roles simultaneously (`user_roles` table)
- Session stores all user roles
- Role-based guards check permissions
- Separate dashboards for each role
- UI toggle between roles (session context switch)

### 1.4 User Settings & Preferences

**Settings Features:**
- Updatable at any time via API
- Granular notification preferences (JSONB)
- GDPR compliant (data export/deletion endpoints)
- Settings changes logged to MongoDB

### 1.5 Post-Registration Events

**Welcome Flow (Async via SQS + BullMQ):**
1. User completes registration → Event to SQS
2. BullMQ worker picks up event:
   - Send welcome email
   - Issue welcome coupon (10% off, 30-day expiry)
   - Create onboarding checklist
   - Suggest popular destinations (based on location)
3. Log all actions to MongoDB

**Coupon Distribution Triggers (SQS Events):**
- New user sign-up: 10% off first booking (30-day expiry)
- Email verification: $10 credit
- Profile completion (80%+): $5 credit
- First booking as host: Reduced service fee coupon
- Referral program: Credits for referrer and referee
- Seasonal promotions (scheduled jobs)
- Birthday coupon (automatic, scheduled via BullMQ)

**Event Structure (SQS Message):**
```json
{
  "eventType": "USER_REGISTERED",
  "userId": "uuid",
  "timestamp": "ISO8601",
  "metadata": {
    "email": "user@example.com",
    "source": "web|oauth"
  }
}
```

---

## 2. Accommodation Listings

### 2.1 Property Information
Media Upload Flow:

Client requests signed S3 upload URL
Direct upload to S3 from client
Webhook/callback confirms upload
URL stored in property_media table
CloudFront URL generated for serving

## 3. Search & Discovery

### 3.1 Search Architecture

**Search Strategy:**
1. **Simple queries:** Direct PostgreSQL with PostGIS for location
2. **Complex queries:** Cache results in Redis
3. **Filters:** Indexed PostgreSQL columns + JSONB queries
4. **Geospatial:** PostGIS `ST_DWithin`, `ST_Distance`

**Redis Caching:**
```
search:results:{hash} -> cached search results (TTL: 5 minutes)
search:popular:{city} -> popular properties (TTL: 1 hour)
```

**Search Parameters:**
- Location (city, coordinates, radius)
- Dates (check-in, check-out)
- Guests (adults, children, infants, pets)
- Price range (min, max per night)
- Property type
- Amenities (multi-select)
- Instant book only
- Ratings (minimum star rating)


### 3.2 Recommendation Engine

**Strategy:**
- User browsing history (logged to MongoDB)
- Collaborative filtering (similar users' bookings)
- Property similarity (location, amenities, price range)
- Personalized suggestions (cached in Redis per user)

---

## 4. Booking & Reservations

### 4.1 Booking Flow

**Booking Creation Flow:**
1. Client submits booking request
2. Validate availability (PostgreSQL transaction with row-level lock)
3. Calculate pricing (including coupons)
4. Create booking record (status: 'pending' or 'confirmed')
5. Create payment_outbox entry (atomic transaction)
6. If instant book: confirm immediately, else await host approval
7. Send notifications (async via SQS → BullMQ)
8. Log to MongoDB

### 4.2 Booking Status Management

**Status Transitions:**
```
pending → confirmed → in_progress → completed
       ↓               ↓
    declined      cancelled
       ↓
    expired (after 24h no response)
```

**Status Update Events (SQS):**
- Each status change triggers event to SQS
- BullMQ workers send notifications
- MongoDB logging for audit trail

---

## 5. Payment System

### 5.1 Payment Architecture
**Payment Flow with Outbox Pattern:**
1. **Booking creation + Outbox entry** (atomic PostgreSQL transaction)
2. **Payment processor worker** (BullMQ):
   - Polls payment_outbox for pending entries
   - Processes payment via Stripe API
   - Updates outbox status
   - Creates payment record on success
3. **SSE notification to client:**
   - On payment completion, send SSE event
   - Client receives real-time payment status update
4. **Webhook handler:**
   - Stripe webhook for async payment updates
   - Updates payment_outbox and payments tables
   - Triggers confirmation flow (SQS → BullMQ)
5. **Retry logic:**
   - Exponential backoff (1m, 5m, 15m, 1h, 6h)
   - Max 5 retries
   - Failed payments → dead letter queue (SQS DLQ)

**BullMQ Job Structure:**
```typescript
{
  name: 'process-payment',
  data: {
    outboxId: 'uuid',
    bookingId: 'uuid',
    idempotencyKey: 'unique-key'
  },
  opts: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    }
  }
}
```

### 5.2 SSE Payment Notifications

**SSE Endpoint:**
```
GET /api/v1/payments/:bookingId/events
```

**Event Stream:**
```typescript
// Server sends
event: payment.processing
data: {"status": "processing", "bookingId": "uuid"}

event: payment.completed
data: {"status": "completed", "bookingId": "uuid", "amount": 150.00}

event: payment.failed
data: {"status": "failed", "bookingId": "uuid", "reason": "insufficient_funds"}
```

### 5.3 Payment Scenarios

- **Full payment upfront** (default)
- **Deposit + remaining balance** (long stays >30 days)
- **Split payments** (multiple payment methods)
- **Payment authorization** (capture after check-in)
- **Refunds** (calculated based on cancellation policy)
- **Host payouts** (released 24h after check-in, via Stripe Connect)

---

## 6. Coupon System

### 6.2 Coupon Distribution

**Automatic Distribution (SQS + BullMQ):**
1. Event triggers (registration, booking completion)
2. SQS message to coupon-distribution queue
3. BullMQ worker creates coupon and sends notification
4. Email with coupon code (via BullMQ email job)

---

## 7. Reviews & Ratings

### 7.2 Review Flow

1. Guest checks out → 14-day review window starts
2. Both parties submit reviews independently
3. Reviews stored as 'pending'
4. When both submitted (or 14 days pass), reviews published simultaneously
5. Notification sent via BullMQ
6. Property rating updated (calculated aggregate)
7. All actions logged to MongoDB

---

## 8. Communication

### 8.2 Email Notifications (BullMQ)

**Email Queue Jobs:**
- Welcome email
- Email verification
- Booking confirmation
- Payment receipt
- Check-in reminder (24h before)
- Review reminder (after checkout)
- Host booking request
- Message notifications (if user offline)

**BullMQ Email Job:**
```typescript
{
  name: 'send-email',
  data: {
    template: 'booking-confirmation',
    to: 'user@example.com',
    context: { bookingId: 'uuid', ... }
  }
}
```

**Email sent via AWS SES:**
- BullMQ worker picks up job
- Renders email template
- Sends via AWS SES
- Logs delivery status to MongoDB

---

## 9. Logging & Monitoring

### 9.1 Application Logging (MongoDB)

**Collections:**
```javascript
// logs collection
{
  _id: ObjectId,
  timestamp: ISODate,
  level: "info|warn|error|debug",
  service: "auth|booking|payment|search",
  userId: "uuid",
  sessionId: "session-key",
  action: "user.login|booking.created|payment.processed",
  metadata: {
    ipAddress: "...",
    userAgent: "...",
    requestId: "...",
    duration: 123, // ms
    statusCode: 200
  },
  message: "User logged in successfully",
  stackTrace: "..." // for errors
}

// audit_logs collection (critical actions)
{
  _id: ObjectId,
  timestamp: ISODate,
  actor: "uuid", // who performed action
  action: "user.role.changed|property.approved|booking.cancelled",
  target: "uuid", // affected resource
  before: {...}, // state before
  after: {...}, // state after
  reason: "...", // if applicable
  ipAddress: "..."
}

// performance_metrics collection
{
  _id: ObjectId,
  timestamp: ISODate,
  endpoint: "/api/v1/bookings",
  method: "POST",
  duration: 234, // ms
  statusCode: 201,
  userId: "uuid",
  queryCount: 5, // number of DB queries
  cacheHits: 2,
  cacheMisses: 1
}
```

### 9.2 Async Logging Strategy

**Logging Flow:**
1. Application logs events synchronously to in-memory buffer
2. Background worker (BullMQ) flushes buffer to MongoDB every 5 seconds
3. Critical errors logged immediately
4. Log retention: 90 days (configurable)

**NestJS Logger Integration:**
```typescript
// Custom logger writes to MongoDB async
@Injectable()
export class MongoLogger extends Logger {
  async log(message, context, metadata) {
    // Add to buffer
    await this.logQueue.add('write-log', {
      level: 'info',
      message,
      context,
      metadata,
      timestamp: new Date()
    });
  }
}
```

---

## 10. Session Management

### 10.1 Redis Session Architecture

**Session Structure:**
```typescript
// Redis key: session:{sessionId}
{
  userId: "uuid",
  email: "user@example.com",
  roles: ["guest", "host"],
  createdAt: "ISO8601",
  lastActivity: "ISO8601",
  ipAddress: "...",
  userAgent: "...",
  metadata: {
    currentRole: "guest", // for role switching
    preferences: {...}
  }
}
```

**Session Management:**
- TTL: 7 days (refreshed on activity)
- Sliding expiration (TTL resets on each request)
- Session revocation support (logout, password change)
- Multiple concurrent sessions allowed
- Session listing endpoint for user

**Redis Keys:**
```
session:{sessionId} -> session data (TTL: 7 days)
user:sessions:{userId} -> Set of session IDs (for listing/revocation)
failed:login:{email} -> failed attempt counter (TTL: 15 min)
account:locked:{userId} -> account lockout flag (TTL: 15 min)
```

---

## 11. Infrastructure & DevOps

### 11.1 Database Connections

**PostgreSQL (Slonik):**
- Read-write pool (max 20 connections)
- Read-only pool (max 50 connections) for reporting
- Connection timeout: 30s
- Query timeout: 60s
- Retry logic with exponential backoff

**MongoDB:**
- Async write concern: `{ w: 1, j: false }` (for logs)
- Connection pool: 10
- Write batching for performance

**Redis:**
- Connection pool: 20
- Cluster mode for HA
- Separate Redis instances:
  - Session store
  - Cache
  - Rate limiting

### 11.2 Queue Architecture (AWS SQS + BullMQ)

**SQS Queues:**
1. `stay-api-events` - Domain events (booking created, payment completed)
2. `stay-api-emails` - Email sending jobs
3. `stay-api-notifications` - SMS/Push notifications
4. `stay-api-payments` - Payment processing
5. `stay-api-dlq` - Dead letter queue for failed jobs

**BullMQ Integration:**
- Polls SQS queues
- Processes jobs with retry logic
- Updates job status in Redis
- Logs to MongoDB

### 11.3 API Design

**RESTful Endpoints:**
```
/api/v1/auth/*              - Authentication
/api/v1/users/*             - User management
/api/v1/properties/*        - Property CRUD
/api/v1/bookings/*          - Booking management
/api/v1/payments/*          - Payment operations
/api/v1/reviews/*           - Reviews & ratings
/api/v1/messages/*          - Messaging (REST)
/api/v1/admin/*             - Admin operations
```

**WebSocket Namespaces:**
```
/ws/chat                    - Messaging
/ws/status                  - User online/offline status
```

**SSE Endpoints:**
```
/api/v1/payments/:id/events - Payment status updates
/api/v1/bookings/:id/events - Booking status updates
```

---

## 12. Development Phases

### Phase 1: Foundation (Weeks 1-3)
1. **Database Setup**
   - PostgreSQL schema design and migrations
   - MongoDB setup for logging
   - Redis setup for sessions

2. **Authentication System**
   - Session-based auth with Redis
   - User registration and login
   - Email/phone verification (BullMQ + SQS)
   - OAuth integration (Google, Facebook, Apple)

3. **Core User Module**
   - User profiles and settings
   - Role management (guest, host, admin)
   - Session management APIs

### Phase 2: Core Business Logic (Weeks 4-7)
1. **Property Module**
   - CRUD operations
   - Media upload (S3 integration)
   - Amenities and pricing
   - Availability calendar

2. **Search & Discovery**
   - PostgreSQL + PostGIS geospatial queries
   - Redis caching
   - Filtering and sorting
   - Basic recommendations

### Phase 3: Booking & Payments (Weeks 8-11)
1. **Booking System**
   - Booking creation with availability check
   - Status management
   - Instant book vs request flow

2. **Payment Integration**
   - Stripe integration
   - Transaction outbox pattern
   - BullMQ payment processor
   - SSE payment notifications
   - Refund logic

3. **Coupon System**
   - Coupon creation and validation
   - Auto-distribution (SQS events)
   - Usage tracking

### Phase 4: Communication & Reviews (Weeks 12-14)
1. **Messaging System**
   - WebSocket chat implementation
   - User status tracking
   - Message persistence

2. **Review System**
   - Review creation and validation
   - Mutual release mechanism
   - Rating aggregation

3. **Email Notifications**
   - BullMQ email queue
   - Template system
   - AWS SES integration

### Phase 5: Advanced Features (Weeks 15-17)
1. **Host Dashboard**
   - Analytics and metrics
   - Earnings tracking
   - Calendar management

2. **Admin Module**
   - User management
   - Property approval
   - Dispute resolution

3. **Additional Features**
   - Wishlist/favorites
   - Referral program
   - Calendar sync (iCal)

### Phase 6: Monitoring & Optimization (Week 18)
1. **Logging & Monitoring**
   - MongoDB logging integration
   - Performance monitoring
   - Error tracking

2. **Performance Optimization**
   - Query optimization
   - Redis caching strategy
   - CDN setup

---

## 14. Environment Configuration

```yaml
# config.yml structure

database:
  postgres:
    rw:
      host: localhost
      port: 5432
      user: postgres
      password: postgres
      database: stay_db
      max_pool_size: 20
    ro:
      host: localhost
      port: 5432
      user: postgres_ro
      password: postgres
      database: stay_db
      max_pool_size: 50

  mongodb:
    uri: mongodb://localhost:27017
    database: stay_logs
    options:
      maxPoolSize: 10
      writeConcern:
        w: 1
        j: false

  redis:
    session:
      host: localhost
      port: 6379
      db: 0
      ttl: 604800 # 7 days
    cache:
      host: localhost
      port: 6379
      db: 1
      ttl: 3600 # 1 hour
    rateLimit:
      host: localhost
      port: 6379
      db: 2

aws:
  region: us-east-1
  sqs:
    events_queue_url: https://sqs.us-east-1.amazonaws.com/.../stay-api-events
    email_queue_url: https://sqs.us-east-1.amazonaws.com/.../stay-api-emails
    payment_queue_url: https://sqs.us-east-1.amazonaws.com/.../stay-api-payments
    dlq_url: https://sqs.us-east-1.amazonaws.com/.../stay-api-dlq
  s3:
    bucket: stay-api-media
    cloudfront_domain: cdn.stayapi.com
  ses:
    from_email: noreply@stayapi.com

payment:
  stripe:
    api_key: sk_test_...
    webhook_secret: whsec_...
    connect_client_id: ca_...

auth:
  session:
    secret: changeme
    ttl: 604800
  oauth:
    google:
      client_id: ...
      client_secret: ...
    facebook:
      app_id: ...
      app_secret: ...
    apple:
      client_id: ...
      team_id: ...
      key_id: ...

security:
  rateLimit:
    ttl: 60
    limit: 100
  lockout:
    attempts: 5
    duration: 900 # 15 minutes
```

---

## Summary

This accommodation service is built with a robust, scalable architecture:

- **Session-based authentication** (Redis) for security and scalability
- **PostgreSQL** for all transactional/business data with PostGIS for geospatial queries
- **MongoDB** for async logging (audit trails, performance metrics)
- **AWS SQS + BullMQ** for reliable async job processing
- **WebSocket** for real-time user status and chat
- **SSE** for payment status notifications
- **Transaction outbox pattern** for reliable payment processing
- **Comprehensive logging** to MongoDB without blocking main application flow

This design ensures high availability, scalability, and reliability for a production-grade accommodation booking platform.
