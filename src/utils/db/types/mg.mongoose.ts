import {OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import mongoose, {Connection, Model, Schema} from 'mongoose';
import {MongoConfig} from 'src/config/types';

export class MongoUtil implements OnModuleInit, OnModuleDestroy {
    private mongoConfig: MongoConfig;
    private connection: Connection;

    constructor(config: MongoConfig) {
        if (config == null) {
            throw new Error('MongoDB configuration not found in config');
        }
        this.mongoConfig = config;
    }

    async onModuleInit() {
        const cfg = this.mongoConfig;
        try {
            const connection = await mongoose
                .createConnection(cfg.uri, {
                    dbName: cfg.database,
                    ...cfg.options,
                })
                .asPromise();
            this.connection = connection;
        } catch (error) {
            console.error('Failed to connect to MongoDB', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.connection?.close();
    }

    getModel<T = any>(name: string, schema: Schema): Model<T> {
        if (!this.connection) {
            throw new Error('MongoDB connection not initialized.');
        }

        if (this.connection.models[name]) {
            return this.connection.models[name] as Model<T>;
        }

        return this.connection.model(name, schema) as unknown as Model<T>;
    }

    getConnection(): Connection {
        if (!this.connection) {
            throw new Error('MongoDB connection not initialized.');
        }
        return this.connection;
    }
}
