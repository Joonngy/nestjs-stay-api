# MongoDB Schema Documentation

## Overview

MongoDB is used exclusively for **async logging** in this application. All business/transactional data is stored in PostgreSQL. MongoDB provides high-performance, non-blocking logging for:

- Application logs
- Audit trails
- Performance metrics

## Database Information

- **Database Name**: `stay_logs`
- **MongoDB Version**: 7+
- **Connection Pool**: 10 max, 2 min
- **Write Concern**: `{ w: 1, j: false }` (optimized for performance)

## Collections

### 1. `logs` - Application Logs

General application logging for all services.

**Schema**:
```typescript
{
  _id: ObjectId,
  timestamp: Date,              // Indexed
  level: string,                // "info" | "warn" | "error" | "debug" (Indexed)
  service: string,              // Service name (Indexed)
  userId: string,               // Optional (Indexed)
  sessionId: string,            // Optional
  action: string,               // Action/event name (Indexed)
  metadata: {                   // Flexible metadata object
    ipAddress: string,
    userAgent: string,
    requestId: string,
    duration: number,           // milliseconds
    statusCode: number,
    [key: string]: any
  },
  message: string,              // Log message
  stackTrace: string            // For errors only
}
```

**Indexes**:
```javascript
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ level: 1, timestamp: -1 });
db.logs.createIndex({ service: 1, timestamp: -1 });
db.logs.createIndex({ userId: 1, timestamp: -1 });
db.logs.createIndex({ action: 1, timestamp: -1 });
```

**Retention Policy**: 90 days (configurable)

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "level": "info",
  "service": "auth",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "session:abc123",
  "action": "user.login",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "requestId": "req-123",
    "duration": 123,
    "statusCode": 200
  },
  "message": "User logged in successfully"
}
```

---

### 2. `audit_logs` - Audit Trail

Critical action tracking for compliance and security auditing.

**Schema**:
```typescript
{
  _id: ObjectId,
  timestamp: Date,              // Indexed
  actor: string,                // User ID who performed action (Indexed)
  action: string,               // Action type (Indexed)
  target: string,               // Affected resource ID (Indexed)
  before: object,               // State before change
  after: object,                // State after change
  reason: string,               // Optional reason/comment
  ipAddress: string             // Actor's IP address
}
```

**Indexes**:
```javascript
db.audit_logs.createIndex({ timestamp: -1 });
db.audit_logs.createIndex({ actor: 1, timestamp: -1 });
db.audit_logs.createIndex({ action: 1, timestamp: -1 });
db.audit_logs.createIndex({ target: 1, timestamp: -1 });
```

**Retention Policy**: 7 years (compliance requirement)

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "timestamp": "2025-11-18T10:35:00.000Z",
  "actor": "550e8400-e29b-41d4-a716-446655440001",
  "action": "user.role.changed",
  "target": "550e8400-e29b-41d4-a716-446655440002",
  "before": { "roles": ["guest"] },
  "after": { "roles": ["guest", "host"] },
  "reason": "User requested host privileges",
  "ipAddress": "192.168.1.1"
}
```

---

### 3. `performance_metrics` - Performance Monitoring

API endpoint performance metrics for monitoring and optimization.

**Schema**:
```typescript
{
  _id: ObjectId,
  timestamp: Date,              // Indexed
  endpoint: string,             // API endpoint path (Indexed)
  method: string,               // HTTP method
  duration: number,             // Request duration in ms (Indexed)
  statusCode: number,           // HTTP status code
  userId: string,               // Optional (Indexed)
  queryCount: number,           // Number of DB queries
  cacheHits: number,            // Cache hits
  cacheMisses: number           // Cache misses
}
```

**Indexes**:
```javascript
db.performance_metrics.createIndex({ timestamp: -1 });
db.performance_metrics.createIndex({ endpoint: 1, timestamp: -1 });
db.performance_metrics.createIndex({ method: 1, timestamp: -1 });
db.performance_metrics.createIndex({ userId: 1, timestamp: -1 });
db.performance_metrics.createIndex({ duration: -1 });
```

**Retention Policy**: 30 days (aggregated data kept longer)

**Example Document**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "timestamp": "2025-11-18T10:40:00.000Z",
  "endpoint": "/api/v1/bookings",
  "method": "POST",
  "duration": 234,
  "statusCode": 201,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "queryCount": 5,
  "cacheHits": 2,
  "cacheMisses": 1
}
```

---

## Logging Strategy

### Async Logging with Buffer

The application uses an in-memory buffer for high-performance logging:

1. **Buffer Size**: 100 logs
2. **Flush Interval**: 5 seconds
3. **Immediate Flush**: Errors and full buffers

**Benefits**:
- Non-blocking application flow
- High-throughput logging
- Reduced MongoDB write operations
- Automatic batching

### Usage Example

```typescript
import { LoggingService } from 'src/utils/logging/logging.service';

@Injectable()
export class SomeService {
  constructor(private readonly loggingService: LoggingService) {}

  async someMethod() {
    // Application log
    await this.loggingService.log(
      'info',
      'booking',
      'booking.created',
      'Booking created successfully',
      { bookingId: '123', propertyId: '456' },
      userId,
      sessionId
    );

    // Error log (writes immediately)
    await this.loggingService.logError(
      'booking',
      'booking.failed',
      'Booking creation failed',
      error.stack,
      { bookingId: '123' },
      userId,
      sessionId
    );

    // Audit log (writes immediately)
    await this.loggingService.auditLog(
      userId,
      'property.approved',
      propertyId,
      ipAddress,
      { status: 'pending' },
      { status: 'approved' },
      'Meets all requirements'
    );

    // Performance metric
    await this.loggingService.performanceMetric(
      '/api/v1/bookings',
      'POST',
      duration,
      201,
      userId,
      5,  // queryCount
      2,  // cacheHits
      1   // cacheMisses
    );
  }
}
```

---

## Data Retention

| Collection | Retention Period | Reason |
|------------|-----------------|---------|
| `logs` | 90 days | Operational logs |
| `audit_logs` | 7 years | Compliance requirement |
| `performance_metrics` | 30 days | Recent performance data |

**Automatic Cleanup**:
Use MongoDB TTL indexes for automatic data expiration:

```javascript
// For logs collection (90 days)
db.logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 }
);

// For performance_metrics collection (30 days)
db.performance_metrics.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 }
);
```

---

## Performance Considerations

### Write Performance

- **Write Concern**: `{ w: 1, j: false }` - Acknowledges after primary write, doesn't wait for journal
- **Buffered Writes**: Reduces write operations by 50-100x
- **Connection Pool**: 10 max connections prevent resource exhaustion

### Query Performance

- **Indexes**: All common query patterns are indexed
- **Time-Series**: Consider time-series collections for high-volume metrics
- **Aggregation**: Use MongoDB aggregation pipeline for analytics

### Monitoring

Monitor these metrics:
- Buffer flush frequency
- Failed log writes
- MongoDB connection pool utilization
- Write latency
- Index usage statistics

---

## Setup Instructions

### 1. Start MongoDB via Docker

```bash
docker-compose up -d stay-api-mongo
```

### 2. Verify Connection

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017

# Switch to logs database
use stay_logs

# List collections
show collections
```

### 3. Create Indexes

Indexes are automatically created by Mongoose schemas, but you can verify:

```bash
# Check indexes for logs collection
db.logs.getIndexes()

# Check indexes for audit_logs collection
db.audit_logs.getIndexes()

# Check indexes for performance_metrics collection
db.performance_metrics.getIndexes()
```

### 4. Set Up TTL Indexes (Optional)

```javascript
// For automatic cleanup after 90 days
db.logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 }
);

// For automatic cleanup after 30 days
db.performance_metrics.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 }
);
```

---

## Backup Strategy

### Regular Backups

```bash
# Backup entire database
mongodump --uri="mongodb://localhost:27017" --db=stay_logs --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://localhost:27017" --db=stay_logs /backup/20251118/stay_logs
```

### Collection-Specific Backup

```bash
# Backup specific collection
mongodump --uri="mongodb://localhost:27017" --db=stay_logs --collection=audit_logs --out=/backup/audit_logs

# Export to JSON
mongoexport --uri="mongodb://localhost:27017" --db=stay_logs --collection=audit_logs --out=audit_logs.json
```

---

## Troubleshooting

### High Memory Usage

If log buffer grows too large:
- Check MongoDB connectivity
- Verify write performance
- Reduce buffer size in `LoggingService`
- Check for slow queries

### Missing Logs

- Check buffer flush interval
- Verify MongoDB is running
- Check connection configuration
- Review error logs for write failures

### Slow Queries

- Verify indexes are created
- Use `.explain()` to analyze queries
- Consider compound indexes for complex queries
- Monitor index usage statistics

---

**Last Updated**: 2025-11-18
**MongoDB Version**: 7+
**Schema Version**: 1.0.0
