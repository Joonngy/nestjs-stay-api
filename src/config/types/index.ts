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

type StayConfig = {
    corsWhitelist: string[];
    rwPgConfig: PgConfig;
    roPgConfig: PgConfig;
    mongoConfig: MongoConfig;
    commonRedisConfig: RedisConfig;
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
