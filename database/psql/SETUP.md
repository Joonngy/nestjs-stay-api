# Database Management Guide

## Overview

This project uses a **SQL-first** approach for database schema management. You edit the SQL schema files directly, and migrations automatically apply those changes.

## Directory Structure

```
database/
├── schemas/              # Source of truth for database schema
│   └── 01_public_schema.sql
├── migrations/           # Generated migration files
│   └── [timestamp]_public-schema.js
└── README.md            # This file
```

## Benefits of This Approach

- **Single Source of Truth**: Only edit SQL files, migrations follow automatically
- **No Duplication**: Don't maintain both SQL and JavaScript definitions
- **SQL Native**: Use full PostgreSQL syntax without JavaScript abstraction
- **Easy Review**: SQL diffs in Git are clear and readable
- **Tool Support**: Use any SQL formatter, linter, or editor


## Best Practices

1. **Always use transactions** - Migrations are wrapped in transactions by default
2. **Test rollbacks** - Always test that `migrate:down` works correctly
3. **Keep migrations small** - One logical change per migration
4. **Document complex changes** - Add comments in SQL for non-obvious changes
5. **Update SQL schema file** - Keep it in sync as the source of truth


## Workflow

### 1. Edit Schema (Source of Truth)

Edit the SQL schema file directly:

```bash
database/psql/schemas/01_public_schema.sql
```

**This is your source of truth.** All schema changes should be made here.

### 2. Migration Automatically Uses SQL File

The migration file reads and executes the SQL schema file:

```javascript
exports.up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, '../schemas/01_public_schema.sql'), 'utf8');
  pgm.sql(sql);
};
```

### 3. Run Migrations

```bash
# Apply migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Check migration status
npm run migrate:status
```


## Migration Commands

```bash
# Create a new migration
npm run migrate:create <migration_name>

# Run all pending migrations
npm run migrate:up

# Rollback the last migration
npm run migrate:down

# Rollback all migrations and rerun
npm run migrate:redo

# Check migration status
npm run migrate:status
```

## Database Connection

The migration tool uses the `DATABASE_URL` environment variable:

```bash
# Set in your shell or .env file
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stay
```

Or it reads from [.node-pg-migraterc](../.node-pg-migraterc) configuration.

## Schema Conventions

### Naming Conventions

- **Tables**: `snake_case` plural (e.g., `users`, `booking_price_breakdown`)
- **Columns**: `snake_case` (e.g., `first_name`, `created_time`)
- **Timestamps**: Use `TIMESTAMPTZ` with `_time` suffix (e.g., `created_time`, `updated_time`)
- **Primary Keys**: Always `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- **Foreign Keys**: `<table>_id` format (e.g., `user_id`, `property_id`)


### Soft Deletes

For tables that need soft deletes:
```sql
deleted_time TIMESTAMPTZ
```

## PostGIS Usage

For geospatial columns:
```sql
coordinates GEOGRAPHY(POINT, 4326)
```

Create spatial index:
```sql
CREATE INDEX idx_properties_coordinates ON properties USING GIST(coordinates);
```


## Troubleshooting

### Migration Failed Mid-way

```bash
# Check current status
npm run migrate:status

# If needed, manually fix the database
psql $DATABASE_URL

# Then mark migration as completed or rollback
npm run migrate:down  # to rollback
# or fix manually and continue
```

### Reset Everything

```bash
# Rollback all migrations
npm run migrate:down

# Rerun all migrations
npm run migrate:up
```

### Fresh Database Setup

```bash
# Start PostgreSQL
docker-compose up -d stay-api-postgres

# Run migrations
npm run migrate:up
```

## Resources

- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
