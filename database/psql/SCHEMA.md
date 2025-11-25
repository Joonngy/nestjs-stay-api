# Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the Stay API accommodation booking platform.

## Technology Stack

- **PostgreSQL** 14+
- **PostGIS** Extension for geospatial queries
- **UUID** for primary keys
- **JSONB** for flexible metadata storage

## Entity Relationship Diagram

```
┌──────────┐          ┌───────────────┐          ┌─────────────┐
│  Users   │◄─────────│  User Roles   │──────────┤ Properties  │
└────┬─────┘          └───────────────┘          └──────┬──────┘
     │                                                    │
     │ 1:1                                               │ 1:N
     │                                                    │
     ▼                                                    ▼
┌──────────────┐                             ┌────────────────────┐
│ User Profiles│                             │Property Amenities  │
└──────────────┘                             │Property Media      │
┌──────────────┐                             │Property Pricing    │
│User Settings │                             │Property Policies   │
└──────────────┘                             │Property Availability│
                                             └────────────────────┘
     │                                                    │
     │ N:M                                               │ 1:N
     ▼                                                    ▼
┌──────────────┐          ┌──────────────┐   ┌──────────────┐
│   Bookings   │──────────│   Payments   │   │   Reviews    │
└──────┬───────┘    1:N   └──────────────┘   └──────────────┘
       │                   ┌──────────────┐
       │ 1:1              │Payment Outbox │
       ▼                   └──────────────┘
┌──────────────────┐
│Booking Breakdown │
└──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐          ┌──────────────┐
│ Conversations│◄─────────│   Messages   │
└──────────────┘    1:N   └──────────────┘
```

## Tables Overview

### 1. User Management (6 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Core authentication | email, password_hash, oauth_provider, last_login_time, deleted_time |
| `user_profiles` | Extended user information | first_name, last_name, phone_number, created_time, updated_time |
| `user_roles` | User role assignment | user_id, role, granted_time |
| `user_settings` | User preferences | notification_preferences, currency, created_time, updated_time |
| `email_verifications` | Email verification tokens | token, expires_time, verified_time |
| `phone_verifications` | Phone OTP verification | otp, expires_time, verified_time |

### 2. Property/Accommodation (7 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `properties` | Accommodation listings | title, coordinates, status, approved_time, created_time, deleted_time |
| `property_amenities` | Property features | amenity_type, is_available |
| `property_media` | Photos/videos | url, media_type, display_order, uploaded_time |
| `property_pricing` | Pricing configuration | base_price_per_night, discounts, created_time, updated_time |
| `property_availability` | Calendar management | date, is_available, price_override |
| `property_policies` | Rules and policies | cancellation_policy, house_rules, created_time, updated_time |

### 3. Booking (2 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `bookings` | Booking records | status, check_in_date, check_out_date, confirmed_time, cancelled_time |
| `booking_price_breakdown` | Detailed pricing | nightly_rate, fees, taxes, coupon, created_time |

### 4. Payment (4 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `payment_outbox` | Transaction outbox pattern | status, idempotency_key, retry_count, next_retry_time, processed_time |
| `payments` | Successful transactions | transaction_id, payment_gateway, created_time, refunded_time |
| `payment_methods` | Saved payment methods | gateway_payment_method_id, created_time, updated_time |
| `host_payouts` | Host earnings | amount, service_fee, net_amount, created_time, processed_time |

### 5. Coupons (2 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `coupons` | Discount codes | code, discount_type, discount_value, valid_from, valid_until, created_time |
| `coupon_usage` | Usage tracking | coupon_id, user_id, applied_amount, usage_timestamp, refunded_time |

### 6. Reviews (2 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `reviews` | Ratings and feedback | overall_rating, review_text, status, created_time, published_time, moderated_time |
| `review_responses` | Host responses | response_text, created_time, updated_time |

### 7. Messaging (2 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `conversations` | Chat threads | guest_id, host_id, booking_id, last_message_time, created_time |
| `messages` | Individual messages | message_text, is_read, sent_time, read_time, deleted_time |

### 8. Other (5 tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `wishlists` | User favorite collections | name, is_public, created_time, updated_time |
| `wishlist_items` | Saved properties | wishlist_id, property_id, added_time |
| `notifications` | In-app notifications | type, is_read, metadata, created_time, read_time, deleted_time |
| `admin_actions` | Admin audit log | action_type, target_type, reason, created_time |
| `security_logs` | Security event tracking | event_type, ip_address, severity, created_time |

## Key Design Decisions

### 1. UUID Primary Keys

All tables use UUID v4 for primary keys to ensure:
- Global uniqueness across distributed systems
- Security (non-sequential, non-guessable)
- Easy data migration/merging

### 2. PostGIS for Geospatial Data

```sql
coordinates GEOGRAPHY(POINT, 4326)
```

- Enables efficient radius-based searches
- Accurate distance calculations
- Spatial indexing with GIST

### 3. JSONB for Flexible Data

Used for:
- `user_settings.notification_preferences` - Granular notification toggles
- `property_policies.house_rules` - Flexible rule definitions
- `notifications.metadata` - Context-specific data
- `payment_outbox.metadata` - Transaction details

### 4. Transaction Outbox Pattern

The `payment_outbox` table implements the outbox pattern for reliable payment processing:

```sql
status: pending → processing → completed (or failed)
retry_count: Auto-retry with exponential backoff
idempotency_key: Prevent duplicate payments
```

### 5. Soft Deletes

Tables with `deleted_time` column:
- `users`
- `properties`

This preserves data integrity and allows data recovery.


## Indexes

### Performance-Critical Indexes

```sql
-- Geospatial search
CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);

-- Booking queries
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);

-- Payment processing
CREATE INDEX idx_payment_outbox_status ON payment_outbox(status);
CREATE INDEX idx_payment_outbox_next_retry ON payment_outbox(next_retry_time)
  WHERE status IN ('pending', 'processing');

-- Message queries
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, sent_time DESC);

-- Unread notifications
CREATE INDEX idx_notifications_unread ON notifications(user_id)
  WHERE is_read = FALSE;
```


### Backup Command

```bash
pg_dump -h localhost -U postgres -d stay_db -F c -f stay_db_backup.dump
```

## Security Considerations

1. **Password Storage**: bcrypt hashed (salt rounds: 10)
2. **Sensitive Data**: PII encrypted at rest
3. **Payment Data**: Tokenized via payment gateway
4. **Soft Deletes**: Preserve data for auditing
5. **Row-Level Security**: Can be implemented per tenant

## Performance Monitoring

### Key Metrics to Monitor

- Query execution time (especially geospatial queries)
- Index usage statistics
- Table bloat
- Connection pool utilization
- Replication lag (if using read replicas)

## Scalability Considerations

### Horizontal Scaling

- Read replicas for read-heavy operations
- Separate write and read connection pools
- Caching layer (Redis) for frequent queries

### Vertical Scaling

- Increase connection pool sizes
- Optimize expensive queries
- Partition large tables (bookings, messages)

## Future Enhancements

1. **Full-text search**: Add `tsvector` columns for property descriptions
2. **Time-series data**: Separate table for property view analytics
3. **Audit tables**: Shadow tables for complete change history
4. **Multi-currency**: Exchange rate table and conversion functions
5. **Multi-tenancy**: Add `tenant_id` for SaaS model

---

**Last Updated**: 2025-11-18
**Schema Version**: 1.0.0
**PostgreSQL Version**: 14+
