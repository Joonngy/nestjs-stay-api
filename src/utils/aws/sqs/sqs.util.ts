import {
    DeleteMessageBatchCommand,
    DeleteMessageBatchCommandInput,
    Message,
    ReceiveMessageCommand,
    ReceiveMessageCommandInput,
    SQSClient,
    SendMessageCommand,
    SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import {Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {AwsSqsConfig} from 'src/config/types';

export interface SqsMessage<T = any> {
    data: T;
}

export class SqsUtil implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SqsUtil.name);
    private readonly DEFAULT_POOL_COUNT = 1;
    private readonly MAX_MESSAGES_PER_RECEIVE = 10;
    private readonly LONG_POLLING_WAIT_TIME = 10; // seconds
    private readonly MESSAGE_DELAY = 1; // seconds

    private sqsConfig: AwsSqsConfig;
    private sqsName: string;
    private sendSqsClient: SQSClient;
    private receiveSqsClientPool: Set<SQSClient>;
    private receiveOption: ReceiveMessageCommandInput;
    private poolCount: number;

    constructor(sqsConfig: AwsSqsConfig, sqsName: string, poolCount?: number) {
        if (!sqsConfig) {
            throw new Error('SQS configuration is required');
        }

        this.sqsConfig = sqsConfig;
        this.sqsName = sqsName;
        this.poolCount = poolCount ?? this.DEFAULT_POOL_COUNT;

        this.setupReceiveOptions();
    }

    onModuleInit() {
        if (this.sqsConfig.mode !== 'development') {
            this.init();
            this.logger.log(`SQS initialized: ${this.sqsName}`);
        } else {
            this.logger.log(`SQS running in development mode: ${this.sqsName}`);
        }
    }

    async onModuleDestroy() {
        this.logger.log(`Cleaning up SQS connections: ${this.sqsName}`);

        if (this.sendSqsClient) {
            this.sendSqsClient.destroy();
        }

        if (this.receiveSqsClientPool) {
            for (const client of this.receiveSqsClientPool) {
                client.destroy();
            }
        }
    }

    private setupReceiveOptions(): void {
        this.receiveOption = {
            AttributeNames: ['All'],
            MaxNumberOfMessages: this.MAX_MESSAGES_PER_RECEIVE,
            MessageAttributeNames: ['All'],
            QueueUrl: this.sqsConfig.queueUrl,
            VisibilityTimeout: this.sqsConfig.visibilityTimeout,
            WaitTimeSeconds: this.LONG_POLLING_WAIT_TIME,
        };
    }

    private init(): void {
        this.validateConfig();

        this.sendSqsClient = new SQSClient({region: this.sqsConfig.region});
        this.receiveSqsClientPool = new Set<SQSClient>();

        for (let i = 0; i < this.poolCount; i++) {
            this.receiveSqsClientPool.add(new SQSClient({region: this.sqsConfig.region}));
        }
    }

    private validateConfig(): void {
        if (!this.sqsConfig.queueUrl || !this.sqsConfig.region) {
            throw new Error('SQS configuration error: queueUrl and region are required');
        }
    }

    getSendClient(): SQSClient {
        if (!this.sendSqsClient) {
            throw new Error('SQS send client not initialized');
        }
        return this.sendSqsClient;
    }

    getReceiveClientPool(): Set<SQSClient> {
        if (!this.receiveSqsClientPool) {
            throw new Error('SQS receive client pool not initialized');
        }
        return this.receiveSqsClientPool;
    }

    async sendMessage<T = any>(message: T): Promise<string | undefined> {
        if (this.sqsConfig.mode === 'development') {
            this.logger.log(`[DEV MODE] Send message: ${JSON.stringify(message)}`);
            return 'dev-mode-message-id';
        }

        if (!this.sendSqsClient) {
            throw new Error('SQS send client not initialized');
        }

        try {
            const messagePayload: SqsMessage<T> = {data: message};
            const optionPayload: SendMessageCommandInput = {
                DelaySeconds: this.MESSAGE_DELAY,
                MessageBody: JSON.stringify(messagePayload),
                QueueUrl: this.sqsConfig.queueUrl,
            };

            const response = await this.sendSqsClient.send(new SendMessageCommand(optionPayload));
            this.logger.log(`Sent SQS message (ID: ${response.MessageId})`);

            return response.MessageId;
        } catch (error) {
            this.logger.error(`Failed to send SQS message`, error);
            throw error;
        }
    }

    async receiveMessages(sqsClient: SQSClient): Promise<Message[] | null> {
        if (this.sqsConfig.mode === 'development') {
            this.logger.log(`[DEV MODE] Receive messages`);
            return null;
        }

        if (!sqsClient) {
            throw new Error('SQS client is required');
        }

        try {
            const response = await sqsClient.send(new ReceiveMessageCommand(this.receiveOption));

            if (response.Messages && response.Messages.length > 0) {
                this.logger.log(`Received ${response.Messages.length} messages`);
                return response.Messages;
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to receive SQS messages`, error);
            throw error;
        }
    }

    async deleteMessages(sqsClient: SQSClient, messages: Message[]): Promise<void> {
        if (!messages || messages.length === 0) {
            return;
        }

        if (this.sqsConfig.mode === 'development') {
            this.logger.log(`[DEV MODE] Delete ${messages.length} messages`);
            return;
        }

        if (!sqsClient) {
            throw new Error('SQS client is required');
        }

        try {
            const deleteParams: DeleteMessageBatchCommandInput = {
                QueueUrl: this.sqsConfig.queueUrl,
                Entries: messages.map((message, index) => ({
                    Id: `${index}`,
                    ReceiptHandle: message.ReceiptHandle,
                })),
            };

            await sqsClient.send(new DeleteMessageBatchCommand(deleteParams));
            this.logger.log(`Deleted ${messages.length} messages`);
        } catch (error) {
            this.logger.error(`Failed to delete SQS messages`, error);
            throw error;
        }
    }
}