<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">A scalable, production-ready accommodation booking platform built with <a href="http://nodejs.org" target="_blank">Node.js</a> and <a href="https://nestjs.com/" target="_blank">NestJS</a>.</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
</p>

# 🏠 Stay API - Accommodation Booking Platform

A comprehensive, enterprise-grade accommodation booking system similar to Airbnb, built with modern technologies and best practices.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring)

## ✨ Features

### Core Functionality

- 🔐 **Session-Based Authentication** - Secure authentication with Redis-backed sessions
- 👥 **User Management** - Guest and Host roles with profile management
- 🏘️ **Property Listings** - Full CRUD for accommodations with media upload
- 🔍 **Advanced Search** - PostGIS geospatial search with filters and caching
- 📅 **Booking System** - Instant book and request-to-book flows
- 💳 **Payment Processing** - Stripe integration with transaction outbox pattern
- 🎟️ **Coupon System** - Flexible discount and promotion management
- ⭐ **Reviews & Ratings** - Bidirectional review system with mutual release
- 💬 **Real-time Messaging** - WebSocket-based chat between guests and hosts
- 📧 **Email Notifications** - Async email processing via BullMQ and AWS SES

### Advanced Features

- 📊 **Prometheus Metrics** - Real-time performance monitoring and alerting
- 🚦 **Rate Limiting** - Redis-backed request throttling
- 🎯 **Feature Flags** - Gradual feature rollout with Unleash
- 🔄 **CQRS + Event Sourcing** - Scalable event-driven architecture
- 🔢 **API Versioning** - Backward-compatible API evolution
- 📈 **Grafana Dashboards** - Visual metrics and analytics
- 🛡️ **Security** - Helmet, CSRF protection, input validation
- 📝 **Comprehensive Logging** - Async logging to MongoDB

## 🛠 Tech Stack

### Core Framework

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Node.js](https://nodejs.org/)** v20+ - Runtime environment

### Databases

- **[PostgreSQL](https://www.postgresql.org/)** (via [Slonik](https://github.com/gajus/slonik)) - Primary transactional database
- **[PostGIS](https://postgis.net/)** - Geospatial queries and location-based search
- **[MongoDB](https://www.mongodb.com/)** - Async application logging and audit trails
- **[Redis](https://redis.io/)** - Sessions, caching, and rate limiting

### Message Queue & Jobs

- **[AWS SQS](https://aws.amazon.com/sqs/)** - Distributed message queue
- **[BullMQ](https://docs.bullmq.io/)** - Redis-based job processing
- **Queue Types:**
  - Events queue (booking, payment events)
  - Email queue (notifications)
  - Payment processing queue
  - Dead letter queue (DLQ)

### Real-time Communication

- **[ws](https://github.com/websockets/ws)** - Lightweight WebSocket library for chat and user status
- **[@nestjs/websockets](https://docs.nestjs.com/websockets/gateways)** - NestJS WebSocket adapter
- **Server-Sent Events (SSE)** - Payment status notifications

### Monitoring & Observability

- **[Prometheus](https://prometheus.io/)** - Metrics collection
- **[Grafana](https://grafana.com/)** - Metrics visualization
- **[prom-client](https://github.com/siimon/prom-client)** - Node.js metrics exporter

### Architecture Patterns

- **CQRS** (Command Query Responsibility Segregation)
- **Event Sourcing** - Audit trail for critical operations
- **Transaction Outbox Pattern** - Reliable payment processing
- **Feature Flags** - Controlled feature rollout

### Payment & External Services

- **[Stripe](https://stripe.com/)** - Payment processing
- **[AWS S3](https://aws.amazon.com/s3/)** - Media storage
- **[AWS CloudFront](https://aws.amazon.com/cloudfront/)** - CDN
- **[AWS SES](https://aws.amazon.com/ses/)** - Email delivery

### Security & Validation

- **[Helmet](https://helmetjs.github.io/)** - HTTP security headers
- **[class-validator](https://github.com/typestack/class-validator)** - DTO validation
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Password hashing
- **[@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)** - Rate limiting

### Developer Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Jest](https://jestjs.io/)** - Testing framework
- **[Swagger/OpenAPI](https://swagger.io/)** - API documentation

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                           │
│  (Web App, Mobile App, Third-party Integrations)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
│  (Rate Limiting, Authentication, API Versioning)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Application                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   REST API   │  │  WebSocket   │  │     SSE      │      │
│  │  (v1, v2)    │  │   (Chat)     │  │  (Payments)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │              CQRS + Event Sourcing                 │     │
│  │  Commands  →  Event Bus  →  Event Handlers        │     │
│  │  Queries   →  Read Models →  Query Handlers       │     │
│  └────────────────────────────────────────────────────┘     │
└────────┬────────────────┬────────────────┬──────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│   PostgreSQL    │ │   Redis     │ │   MongoDB    │
│  (Transactional)│ │  (Sessions) │ │   (Logs)     │
│   + PostGIS     │ │  (Cache)    │ │              │
└─────────────────┘ └─────────────┘ └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Message Queue Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AWS SQS    │→ │   BullMQ     │→ │   Workers    │      │
│  │   (Events)   │  │  (Processor) │  │  (Email,     │      │
│  │              │  │              │  │   Payment)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Services                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Stripe  │  │  AWS S3  │  │ AWS SES  │  │CloudFront│   │
│  │(Payment) │  │ (Media)  │  │ (Email)  │  │  (CDN)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Monitoring & Observability                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Prometheus  │→ │   Grafana    │  │  MongoDB     │      │
│  │  (Metrics)   │  │ (Dashboard)  │  │  (Logs)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
src/
├── modules/
│   ├── auth/                    # Authentication & authorization
│   │   ├── strategies/          # Passport strategies
│   │   ├── guards/              # Auth guards
│   │   └── decorators/          # Custom decorators
│   ├── users/                   # User management
│   │   ├── commands/            # CQRS commands
│   │   ├── queries/             # CQRS queries
│   │   ├── events/              # Domain events
│   │   └── handlers/            # Event handlers
│   ├── properties/              # Property listings
│   ├── bookings/                # Booking system
│   ├── payments/                # Payment processing
│   │   └── outbox/              # Transaction outbox
│   ├── coupons/                 # Coupon system
│   ├── reviews/                 # Reviews & ratings
│   ├── messaging/               # Real-time chat
│   ├── notifications/           # Email/SMS notifications
│   ├── search/                  # Search & discovery
│   ├── feature-flags/           # Feature flag management
│   └── admin/                   # Admin operations
├── common/
│   ├── decorators/              # Shared decorators
│   ├── guards/                  # Shared guards
│   ├── interceptors/            # Request/response interceptors
│   ├── pipes/                   # Validation pipes
│   ├── filters/                 # Exception filters
│   └── middleware/              # Custom middleware
├── database/
│   ├── migrations/              # Database migrations
│   └── schemas/                 # Schema definitions
├── workers/
│   ├── payment-processor/       # Payment processing worker
│   ├── email-sender/            # Email sending worker
│   └── event-processor/         # Domain event processor
├── monitoring/
│   ├── metrics/                 # Prometheus metrics
│   └── health/                  # Health checks
├── config/
│   ├── configuration.ts         # App configuration
│   └── types/                   # Config types
└── utils/
    ├── db/                      # Database utilities
    ├── cache/                   # Cache utilities
    ├── logger/                  # Logger utilities
    └── helpers/                 # Helper functions
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.0.0 or higher
- **PostgreSQL** 14+ with PostGIS extension
- **MongoDB** 6+
- **Redis** 7+
- **Docker** & Docker Compose (recommended)
- **AWS Account** (for SQS, S3, SES)
- **Stripe Account** (for payments)

### Installation

```bash
# 1. Clone the repository
$ git clone <repository-url>
$ cd 02_nestjs-stay-api

# 2. Install dependencies
$ npm install

# 3. Set up configuration
$ cp config.example.yml config.yml
# Edit config.yml with your settings

# 4. Start infrastructure
$ docker-compose up -d

# 5. Run database migrations
$ npm run migrate:up
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### API Versioning

The API supports versioning to ensure backward compatibility:

- **v1**: `/api/v1/*` - Current stable version
- **v2**: `/api/v2/*` - Next version (when available)

### Interactive Documentation

Swagger UI available at:

- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://api.yourdomain.com/api/docs`

### Rate Limiting

All API endpoints are rate-limited:

- **Default**: 100 requests per minute
- **Authentication**: 10 requests per minute
- **Uploads**: 5 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
```

## 💻 Development

### Project Structure

See [Architecture](#-architecture) section for detailed module structure.

### Event Sourcing

Critical operations use event sourcing:

```typescript
export class PaymentAggregate extends AggregateRoot {
  processPayment() {
    this.apply(new PaymentProcessedEvent(this.id, this.amount));
  }

  completePayment() {
    this.apply(new PaymentCompletedEvent(this.id));
  }

  // Event handlers
  onPaymentProcessedEvent(event: PaymentProcessedEvent) {
    this.status = PaymentStatus.PROCESSING;
  }

  onPaymentCompletedEvent(event: PaymentCompletedEvent) {
    this.status = PaymentStatus.COMPLETED;
  }
}
```

### Feature Flags

Control feature rollout:

```typescript
@Injectable()
export class BookingService {
  constructor(private featureFlags: FeatureFlagService) {}

  async createBooking(dto: CreateBookingDto) {
    const instantBookEnabled = await this.featureFlags.isEnabled('instant-book');

    if (instantBookEnabled) {
      return this.createInstantBooking(dto);
    }
    return this.createRequestBooking(dto);
  }
}
```

## 🧪 Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov

# watch mode
$ npm run test:watch
```

### Test Coverage Requirements

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## 📊 Monitoring

### Prometheus Metrics

Available at: `http://localhost:3000/metrics`

**Custom Metrics:**

- `http_requests_total` - Total HTTP requests
- `http_request_duration_ms` - Request duration
- `booking_created_total` - Total bookings
- `payment_processed_total` - Total payments
- `active_websocket_connections` - Active connections
- `redis_cache_hit_total` - Cache hits
- `db_query_duration_ms` - Query duration
- `queue_jobs_active` - Active queue jobs

### Grafana Dashboards

(To Be Developed)

### Health Checks

```bash
# Application health
GET /health

# Database health
GET /health/db

# Redis health
GET /health/redis

# Detailed health
GET /health/detailed
```

## 🚀 Deployment

### Docker

```bash
# Build
$ docker build -t stay-api:latest .

# Run
$ docker run -d -p 3000:3000 stay-api:latest
```

### Docker Compose

```bash
$ docker-compose up -d
```

### Kubernetes

```bash
# Apply configurations
$ kubectl apply -f k8s/

# Check status
$ kubectl get pods
$ kubectl get services
```

## 🔒 Security

### Authentication

- Session-based authentication with Redis
- Session TTL: 7 days
- CSRF protection enabled
- Secure cookie settings

### Rate Limiting

- Global rate limit: 100 req/min
- Per-route limits configurable
- Redis-backed throttling

### Input Validation

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
  password: string;
}
```

### Security Headers

Helmet configured with:

- Content Security Policy
- HSTS
- XSS Protection
- Frame Options

## 📈 Performance

### Caching Strategy

- User sessions: 7 days TTL
- Search results: 5 minutes TTL
- Property data: 1 hour TTL
- API responses: Configurable per endpoint

### Database Optimization

- Connection pooling (RW: 20, RO: 50)
- Read replicas for reporting
- Indexed columns for common queries
- PostGIS spatial indexes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add instant booking feature
fix: resolve payment webhook timeout
docs: update API documentation
test: add booking service tests
```

## 📄 License

This project is [UNLICENSED](LICENSE).

## 👥 Author

**Jason Lee** - [joonnngy@gmail.com](mailto:joonnngy@gmail.com)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- All open-source contributors

---

<p align="center">
  Built with ❤️ using <a href="https://nestjs.com/" target="_blank">NestJS</a>
</p>
