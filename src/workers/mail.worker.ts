// src/workers/email.worker.ts

import {Injectable, Inject, OnModuleInit} from '@nestjs/common';
import {Worker, Job} from 'bullmq';
import {BULL_MAIL_QUEUE} from 'src/config/types/constant';
import {MailService} from 'src/modules/message/mail/mail.service';
import { BullMqUtil } from 'src/utils/queue/bullmq/bullmq.util';

@Injectable()
export class EmailWorker implements OnModuleInit {
    private worker: Worker;

    constructor(
        @Inject(BULL_MAIL_QUEUE)
        private readonly mailQueueUtil: BullMqUtil,
        private readonly mailService: MailService,
    ) {}

    onModuleInit() {
        const queue = this.mailQueueUtil.getQueue();

        this.worker = new Worker(
            queue.name,
            async (job: Job) => {
                return this.processJob(job);
            },
            {
                connection: queue.opts.connection,
                concurrency: 5, // Process 5 jobs concurrently
            }
        );

        this.worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`Job ${job.id} failed:`, err);
        });
    }

    private async processJob(job: Job) {
        switch (job.name) {
            case 'send-welcome-email':
                return await this.mailService.processRequest(job.name, data);
            case 'send-verification-email':
                return this.sendVerificationEmail(job.data);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    private async sendWelcomeMail(data: any) {
        
    }

    private async sendVerificationEmail(data: any) {
        await this.mailService.sendVerificationEmail(data.email, data.token);
    }

    async onModuleDestroy() {
        await this.worker.close();
    }
}