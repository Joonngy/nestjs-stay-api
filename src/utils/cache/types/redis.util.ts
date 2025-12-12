import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {createClient, RedisClientType} from 'redis';
import {Config} from '../../../config/types';

@Injectable()
export class RedisUtil {
    private commonClient: RedisClientType;
    private readonly logger: Logger = new Logger(RedisUtil.name);

    constructor(private readonly configService: ConfigService<Config>) {
        const commonRedisConfig = this.configService.get('stayConfig.commonRedisConfig', {infer: true});
        this.commonClient = createClient({
            socket: {
                host: commonRedisConfig.host,
                port: commonRedisConfig.port,
                connectTimeout: 60000,
                reconnectStrategy: () => {
                    console.error(`common Redis connection interruption`);
                    console.error('Retrying');
                    return commonRedisConfig.retryTimeout;
                },
            },
        });
    }

    public async redisConnect(): Promise<void> {
        try {
            await this.commonClient.connect();
            this.logger.log('redis client connected');
        } catch (error) {
            this.logger.error('redis client connected error');
            throw error;
        }
    }

    get commonCacheRedis(): RedisClientType {
        return this.commonClient;
    }
}
