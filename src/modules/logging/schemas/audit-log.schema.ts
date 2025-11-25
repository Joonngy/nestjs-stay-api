import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AUDIT_LOG } from 'src/config/types/constant';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: AUDIT_LOG, timestamps: false })
export class AuditLog {
  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true, index: true })
  actor: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true, index: true })
  target: string;

  @Prop({ type: Object })
  before?: Record<string, any>;

  @Prop({ type: Object })
  after?: Record<string, any>;

  @Prop()
  reason?: string;

  @Prop({ required: true })
  ipAddress: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create indexes
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actor: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ target: 1, timestamp: -1 });
