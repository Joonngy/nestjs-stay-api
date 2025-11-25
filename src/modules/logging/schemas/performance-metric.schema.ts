import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PERFORMANCE_METRIC } from 'src/config/types/constant';

export type PerformanceMetricDocument = PerformanceMetric & Document;

@Schema({ collection: PERFORMANCE_METRIC, timestamps: false })
export class PerformanceMetric {
  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true, index: true })
  endpoint: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ index: true })
  userId?: string;

  @Prop({ default: 0 })
  queryCount: number;

  @Prop({ default: 0 })
  cacheHits: number;

  @Prop({ default: 0 })
  cacheMisses: number;
}

export const PerformanceMetricSchema = SchemaFactory.createForClass(PerformanceMetric);

// Create indexes
PerformanceMetricSchema.index({ timestamp: -1 });
PerformanceMetricSchema.index({ endpoint: 1, timestamp: -1 });
PerformanceMetricSchema.index({ method: 1, timestamp: -1 });
PerformanceMetricSchema.index({ userId: 1, timestamp: -1 });
PerformanceMetricSchema.index({ duration: -1 });
