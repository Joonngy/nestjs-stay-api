import {Module} from '@nestjs/common';
import {REDIS_UTIL} from 'src/config/types/constant';
import {RedisUtil} from './types/redis.util';

const redisProvider = {
    provide: REDIS_UTIL,
    inject: [RedisUtil],
    useFactory: async (redisUtil: RedisUtil) => {
        await redisUtil.redisConnect();

        return redisUtil;
    },
};

@Module({
    providers: [redisProvider, RedisUtil],
    exports: [redisProvider],
})
export class CacheModule {}
