import {MailProviderName, MailSendStatus} from 'src/modules/message/mail/mail-provider/mail-provider.type';
import {$Enums} from 'src/types/enum';
import {WebsocketConnectType, WebsocketSubscribeChannelType} from 'src/types/websocket.type';

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
export const REDIS_UTIL = 'REDIS_UTIL';

// AWS SQS
export const SQS_UTIL = 'SQS_UTIL';

// BULLMQ
export const BULLMQ_UTIL = 'BULLMQ_UTIL';
export const BULL_MAIL_QUEUE = 'BULL_MAIL_QUEUE';
export const BULL_PUSH_QUEUE = 'BULL_PUSH_QUEUE';

// WEBSOCKET
export const WEBSOCKET_PORT = 32099;
export const WEBSOCKET_PATH = '/api/v1/ws';
export const WEBSOCKET_SUBSCRIBE: WebsocketConnectType = 'subscribe';
export const WEBSOCKET_UNSUBSCRIBE: WebsocketConnectType = 'unsubscribe';
export const WEBSOCKET_CHANNEL_USER_STATUS: WebsocketSubscribeChannelType = 'user_status';

// MAIL
export const MAIL_PROVIDER_SMTP_SERVER: MailProviderName = 'smtp_server';
export const MAIL_STATUS_FAILED: MailSendStatus = 'failed';
export const MAIL_STATUS_QUEUED: MailSendStatus = 'queued';
export const MAIL_STATUS_DELIVERED: MailSendStatus = 'delivered';
