import {Module} from '@nestjs/common';

import {REDIS_SERVICE} from 'src/config/types/constant';
import {RedisService} from './types/redis.service';

const redisProvider = {
    provide: REDIS_SERVICE,
    inject: [RedisService],
    useFactory: async (redisService: RedisService) => {
        await redisService.redisConnect();

        return redisService;
    },
};

@Module({
    providers: [redisProvider, RedisService],
    exports: [redisProvider],
})
export class CacheModule {}
