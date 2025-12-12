export type PgConfigBase = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?:
        | boolean
        | {
              rejectUnauthorized?: boolean;
              ca?: string;
              cert?: string;
              key?: string;
          };
};

export type PgConfig = PgConfigBase & {
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    max?: number;
    searchPath?: string;
};

export type MongoConfig = {
    uri: string;
    database: string;
    options: {
        maxPoolSize: number;
        minPoolSize: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        writeConcern: {
            w: number;
            j: boolean;
        };
    };
};

export type RedisConfig = {
    host: string;
    port: number;
    retryTimeout: number;
};

export interface AwsSqsConfig {
    queueUrl: string;
    region: string;
    visibilityTimeout: number;
    mode?: 'development' | 'deployment';
}

export type AwsS3Config = {
    userProfile: {
        bucket: string;
        acl?: string;
        serverSideEncryption?: string;
        [key: string]: any;
    };
};

export type BullMqConfig = {
    redis: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    defaultJobOptions?: {
        attempts: number;
        backoff: {
            type: 'exponential' | 'fixed';
            delay: number;
        };
        removeOnComplete: boolean | number;
        removeOnFail: boolean | number;
    };
};

export type SmtpConfig = {
    host: string; // smtp.gmail.com
    port: number; // 587, 465, or 25
    secure: boolean; // true for 465, false for other
    domain: string;
    auth: {
        user: string;
        pass: string;
    };
    pool?: boolean; // Use connection pooling
    maxConnections?: number;
    maxMessages?: number; // Per connection
    rateDelta?: number; // Rate limiting window
    rateLimit?: number; // Max emails per window
};

type StayConfig = {
    corsWhitelist: string[];
    rwPgConfig: PgConfig;
    roPgConfig: PgConfig;
    mongoConfig: MongoConfig;
    commonRedisConfig: RedisConfig;
    bullMqConfig: BullMqConfig;
    message: {
        mail: {
            smtpConfig: SmtpConfig;
        };
    };
    aws: {
        sqsConfig: AwsSqsConfig;
        s3: AwsS3Config;
    };
    port: {
        api: number;
        websocket: number;
    };
};

export type Config = {
    stayConfig: StayConfig;
};
