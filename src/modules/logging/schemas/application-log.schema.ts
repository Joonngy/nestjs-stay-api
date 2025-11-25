import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {APPLICATION_LOG} from 'src/config/types/constant';

type LogLevelType = 'info' | 'warn' | 'error' | 'debug';
export type ApplicationLogDocument = ApplicationLog & Document;

@Schema({collection: APPLICATION_LOG, timestamps: false})
export class ApplicationLog {
    @Prop({required: true, index: true})
    timestamp: Date;

    @Prop({required: true, enum: ['info', 'warn', 'error', 'debug'], index: true})
    level: LogLevelType;

    @Prop({required: true, index: true})
    service: string;

    @Prop({index: true})
    userId?: string;

    @Prop()
    sessionId?: string;

    @Prop({required: true, index: true})
    action: string;

    @Prop({type: Object})
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        requestId?: string;
        duration?: number;
        statusCode?: number;
        [key: string]: any;
    };

    @Prop({required: true})
    message: string;

    @Prop()
    stackTrace?: string;
}

export const ApplicationLogSchema = SchemaFactory.createForClass(ApplicationLog);

// Create indexes
ApplicationLogSchema.index({timestamp: -1});
ApplicationLogSchema.index({level: 1, timestamp: -1});
ApplicationLogSchema.index({service: 1, timestamp: -1});
ApplicationLogSchema.index({userId: 1, timestamp: -1});
ApplicationLogSchema.index({action: 1, timestamp: -1});
