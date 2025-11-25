# MongoDB Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@nestjs/mongoose` - NestJS MongoDB integration
- `mongoose` - MongoDB ODM

### 2. Start MongoDB Container

```bash
docker-compose up -d stay-api-mongo
```

Verify it's running:
```bash
docker ps | grep mongo
```

### 3. Configure Your Application

The MongoDB configuration is already set in [config.yml](../config.yml):

```yaml
x-mongoConfig: &mongoConfig
  uri: 'mongodb://localhost:27017'
  database: 'stay_logs'
  options:
    maxPoolSize: 10
    minPoolSize: 2
    serverSelectionTimeoutMS: 5000
    socketTimeoutMS: 45000
    writeConcern:
      w: 1
      j: false
```


### 4. Test MongoDB Connection

Connect to MongoDB shell:
```bash
mongosh mongodb://localhost:27017
```


## Usage in Your Services

### Example: Logging in a Controller

```typescript
import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/utils/logging/logging.service';

@Injectable()
export class UsersService {
  constructor(private readonly loggingService: LoggingService) {}

  async createUser(createUserDto: CreateUserDto, userId: string, sessionId: string) {
    try {
      // Your business logic...
      const user = await this.userRepository.create(createUserDto);

      // Log successful creation
      await this.loggingService.log(
        'info',
        'users',
        'user.created',
        'User created successfully',
        { userId: user.id, email: user.email },
        userId,
        sessionId
      );

      return user;
    } catch (error) {
      // Log error
      await this.loggingService.logError(
        'users',
        'user.create.failed',
        'Failed to create user',
        error.stack,
        { email: createUserDto.email },
        userId,
        sessionId
      );

      throw error;
    }
  }

  async updateUserRole(
    userId: string,
    newRole: string,
    actorId: string,
    ipAddress: string
  ) {
    const user = await this.userRepository.findById(userId);
    const before = { roles: user.roles };

    user.roles.push(newRole);
    await this.userRepository.save(user);

    const after = { roles: user.roles };

    // Audit log for role change
    await this.loggingService.auditLog(
      actorId,
      'user.role.changed',
      userId,
      ipAddress,
      before,
      after,
      'User requested host privileges'
    );
  }
}
```

### Example: Performance Tracking Interceptor

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from 'src/utils/logging/logging.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();

        this.loggingService.performanceMetric(
          request.url,
          request.method,
          duration,
          response.statusCode,
          request.user?.id,
        );
      }),
    );
  }
}
```

## Maintenance

### Manual Data Cleanup

```javascript
// Delete logs older than 90 days
db.logs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
})

// Delete performance metrics older than 30 days
db.performance_metrics.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

### Set Up Automatic Cleanup (TTL Indexes)

```javascript
// Auto-delete logs after 90 days
db.logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000 }  // 90 days
)

// Auto-delete performance metrics after 30 days
db.performance_metrics.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 2592000 }  // 30 days
)
```

### Backup

```bash
# Full backup
mongodump --uri="mongodb://localhost:27017" --db=stay_logs --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017" --db=stay_logs /backup/20251118/stay_logs

# Export audit logs to JSON (for compliance)
mongoexport --uri="mongodb://localhost:27017" \
  --db=stay_logs \
  --collection=audit_logs \
  --out=audit_logs_$(date +%Y%m%d).json
```

## Troubleshooting

### MongoDB Container Won't Start

```bash
# Check container logs
docker logs stay-api-mongo

# Restart container
docker-compose restart stay-api-mongo

# Remove and recreate
docker-compose down
docker volume rm 02_nestjs-stay-api_mongodata
docker-compose up -d stay-api-mongo
```

### Connection Issues

```bash
# Test connection
mongosh mongodb://localhost:27017

# Check if MongoDB is listening
netstat -an | grep 27017

# Check Docker network
docker network inspect 02_nestjs-stay-api_default
```

### High Memory Usage

Check buffer size and flush interval in [logging.service.ts](../src/utils/logging/logging.service.ts):

```typescript
private readonly BUFFER_SIZE = 100;        // Reduce if needed
private readonly FLUSH_INTERVAL = 5000;    // Reduce for more frequent flushes
```

### Slow Queries

```javascript
// Enable profiling
db.setProfilingLevel(2)

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ millis: -1 })

// Check index usage
db.logs.find({ level: "error" }).explain("executionStats")
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start MongoDB**: `docker-compose up -d stay-api-mongo`
3. **Update app.module.ts**: Add `MongoModule` and `LoggingModule`
4. **Test logging**: Use `LoggingService` in your services
5. **Set up monitoring**: Create dashboards for logs and metrics
6. **Configure TTL indexes**: Set up automatic data cleanup

For detailed schema information, see [MONGODB_SCHEMA.md](./MONGODB_SCHEMA.md).
