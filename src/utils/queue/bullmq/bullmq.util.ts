import {Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {Queue, Job, JobsOptions, QueueOptions} from 'bullmq';
import {BullMqConfig} from 'src/config/types';

export class BullMqUtil implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BullMqUtil.name);
    private queue: Queue;
    private queueName: string;
    private bullMqConfig: BullMqConfig;

    constructor(bullMqConfig: BullMqConfig, queueName: string) {
        if (!bullMqConfig) {
            throw new Error('BullMQ configuration is required');
        }

        this.bullMqConfig = bullMqConfig;
        this.queueName = queueName;
    }

    onModuleInit() {
        const queueOptions: QueueOptions = {
            connection: {
                host: this.bullMqConfig.redis.host,
                port: this.bullMqConfig.redis.port,
                password: this.bullMqConfig.redis.password,
                db: this.bullMqConfig.redis.db,
            },
            defaultJobOptions: this.bullMqConfig.defaultJobOptions,
        };

        this.queue = new Queue(this.queueName, queueOptions);
        this.logger.log(`BullMQ queue initialized: ${this.queueName}`);
    }

    async onModuleDestroy() {
        this.logger.log(`Closing BullMQ queue: ${this.queueName}`);
        await this.queue.close();
    }

    getQueue(): Queue {
        if (!this.queue) {
            throw new Error('BullMQ queue not initialized');
        }
        return this.queue;
    }

    async addJob<T = any>(
        jobName: string,
        data: T,
        options?: JobsOptions
    ): Promise<Job<T>> {
        if (!this.queue) {
            throw new Error('BullMQ queue not initialized');
        }

        try {
            const job = await this.queue.add(jobName, data, options);
            this.logger.log(`Added job: ${jobName} (ID: ${job.id})`);
            return job;
        } catch (error) {
            this.logger.error(`Failed to add job: ${jobName}`, error);
            throw error;
        }
    }

    async addBulkJobs<T = any>(
        jobs: Array<{name: string; data: T; opts?: JobsOptions}>
    ): Promise<Job<T>[]> {
        if (!this.queue) {
            throw new Error('BullMQ queue not initialized');
        }

        try {
            const addedJobs = await this.queue.addBulk(jobs);
            this.logger.log(`Added ${jobs.length} bulk jobs`);
            return addedJobs;
        } catch (error) {
            this.logger.error(`Failed to add bulk jobs`, error);
            throw error;
        }
    }

    async getJob(jobId: string): Promise<Job | undefined> {
        return this.queue.getJob(jobId);
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.getJob(jobId);
        if (job) {
            await job.remove();
            this.logger.log(`Removed job: ${jobId}`);
        }
    }
}