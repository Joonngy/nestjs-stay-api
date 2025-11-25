import {Inject, Injectable, Logger} from '@nestjs/common';
import {Model} from 'mongoose';
import {ApplicationLog, ApplicationLogDocument, ApplicationLogSchema, AuditLog, AuditLogDocument, AuditLogSchema, PerformanceMetric, PerformanceMetricDocument, PerformanceMetricSchema} from './schemas';
import {APPLICATION_LOG, AUDIT_LOG, MG_UTIL, PERFORMANCE_METRIC} from 'src/config/types/constant';
import {MongoUtil} from 'src/utils/db/types/mg.mongoose';

interface LogBuffer {
    logs: any[];
    flushTimer?: NodeJS.Timeout;
}

@Injectable()
export class LoggingService {
    private readonly logger = new Logger(LoggingService.name);
    private readonly logBuffer: LogBuffer = {logs: []};
    private readonly BUFFER_SIZE = 100;
    private readonly FLUSH_INTERVAL = 5000; // 5 seconds

    private readonly applicationLogModel: Model<ApplicationLogDocument>;
    private readonly auditLogModel: Model<AuditLogDocument>;
    private readonly performanceMetricModel: Model<PerformanceMetricDocument>;

    constructor(@Inject(MG_UTIL) private readonly mongoUtil: MongoUtil) {
        this.applicationLogModel = this.mongoUtil.getModel<ApplicationLogDocument>(APPLICATION_LOG, ApplicationLogSchema);
        this.auditLogModel = this.mongoUtil.getModel<AuditLogDocument>(AUDIT_LOG, AuditLogSchema);
        this.performanceMetricModel = this.mongoUtil.getModel<PerformanceMetricDocument>(PERFORMANCE_METRIC, PerformanceMetricSchema);

        this.startFlushTimer();
    }

    private startFlushTimer() {
        this.logBuffer.flushTimer = setInterval(() => {
            this.flushLogs();
        }, this.FLUSH_INTERVAL);
    }

    private async flushLogs() {
        if (this.logBuffer.logs.length === 0) {
            return;
        }

        const logsToFlush = [...this.logBuffer.logs];
        this.logBuffer.logs = [];

        try {
            await this.applicationLogModel.insertMany(logsToFlush, {ordered: false});
        } catch (error) {
            this.logger.error('Failed to flush logs to MongoDB', error);
            // Re-add failed logs back to buffer (with limit to prevent memory issues)
            this.logBuffer.logs.unshift(...logsToFlush.slice(0, this.BUFFER_SIZE));
        }
    }

    async applicationLog(data: ApplicationLog) {
        const logEntry = {
            timestamp: new Date(),
            level: data.level,
            service: data.service,
            userId: data.userId ?? null,
            sessionId: data.sessionId ?? null,
            action: data.action,
            metadata: data.metadata ?? {},
            message: data.message,
            stackTrace: data.stackTrace ?? null,
        };

        this.logBuffer.logs.push(logEntry);

        // Flush immediately if buffer is full or if it's an error
        if (this.logBuffer.logs.length >= this.BUFFER_SIZE || data.level === 'error') {
            await this.flushLogs();
        }
    }

    async auditLog(data: AuditLog) {
        const auditEntry = {
            timestamp: new Date(),
            actor: data.actor,
            action: data.action,
            target: data.target,
            before: data.before ?? null,
            after: data.after ?? null,
            reason: data.reason ?? null,
            ipAddress: data.ipAddress,
        };

        try {
            await this.auditLogModel.create(auditEntry);
        } catch (error) {
            this.logger.error('Failed to write audit log to MongoDB', error);
        }
    }

    async performanceMetric(data: PerformanceMetric) {
        const metricEntry = {
            timestamp: new Date(),
            endpoint: data.endpoint,
            method: data.method,
            duration: data.duration,
            statusCode: data.statusCode,
            userId: data.userId ?? null,
            queryCount: data.queryCount || 0,
            cacheHits: data.cacheHits || 0,
            cacheMisses: data.cacheMisses || 0,
        };

        try {
            await this.performanceMetricModel.create(metricEntry);
        } catch (error) {
            this.logger.error('Failed to write performance metric to MongoDB', error);
        }
    }

    async onModuleDestroy() {
        // Flush remaining logs before shutdown
        if (this.logBuffer.flushTimer) {
            clearInterval(this.logBuffer.flushTimer);
        }
        await this.flushLogs();
    }
}
