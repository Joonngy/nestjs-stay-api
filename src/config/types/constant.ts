// PSQL
export const RW_PG_UTIL = 'RW_PG_UTIL';
export const RO_PG_UTIL = 'RO_PG_UTIL';
export const PG_UTIL_DEFAULT_TIMEOUT = 5000;
export type PgConnectMode = 'READ_ONLY' | 'READ_WRITE';
export const READ_ONLY: PgConnectMode = 'READ_ONLY';
export const READ_WRITE: PgConnectMode = 'READ_WRITE';

// MONGO
export const MG_UTIL = 'MG_UTIL';
export const APPLICATION_LOG = 'ApplicationLog';
export const AUDIT_LOG = 'AuditLog';
export const PERFORMANCE_METRIC = 'PerformanceMetric';

// REDIS
export const REDIS_SERVICE = 'REDIS_SERVICE';