import {Inject, Injectable} from '@nestjs/common';
import {
    BroadcastUserStatusInfo,
    ONLINE,
    TTL_EXPIRATION_TIME,
    USER_STATUS_HASH_KEY,
    USER_STATUS_HASH_TTL_KEY,
    UserStatusType,
} from './user-status.type';
import {UserStatusRepository} from './user-status.repository';
import {REDIS_SERVICE} from 'src/config/types/constant';
import {RedisService} from 'src/utils/cache/types/redis.service';

@Injectable()
export class UserStatusService {
    constructor(
        @Inject(REDIS_SERVICE)
        private readonly redisService: RedisService,
        private readonly userStatusRepository: UserStatusRepository,
    ) {}

    async redisSubscriberInit(callback: (key: string) => void) {
        // await this.redisService.authCacheRedisSubscriber.configSet('notify-keyspace-events', 'AKE');
        await this.redisService.commonCacheRedis.subscribe('__keyevent@0__:expired', (key) => callback(key));
    }

    async checkUserInfo(userId: string): Promise<boolean> {
        return await this.userStatusRepository.checkUserInfo(userId);
    }

    async searchStatuses(uids: string[]): Promise<BroadcastUserStatusInfo> {
        const result: BroadcastUserStatusInfo = {};

        if (uids.length === 0) {
            return result;
        }

        const statuses = await this.redisService.commonCacheRedis.hmGet(USER_STATUS_HASH_KEY, uids);

        uids.forEach((userId, index) => {
            if (statuses[index] !== null) {
                result[userId] = ONLINE;
            }
        });

        return result;
    }

    async getOnlineUsers(): Promise<BroadcastUserStatusInfo> {
        const values = await this.redisService.commonCacheRedis.hGetAll(USER_STATUS_HASH_KEY);

        const results: BroadcastUserStatusInfo = {};

        for (const field in values) {
            results[field] = ONLINE;
        }

        return results;
    }

    async getStatus(userId: string): Promise<string | null> {
        const value = await this.redisService.commonCacheRedis.hGet(USER_STATUS_HASH_KEY, userId);

        return value == null ? null : userId;
    }

    async setStatus(uid: string, status: UserStatusType): Promise<BroadcastUserStatusInfo> {
        await this.redisService.commonCacheRedis.hSet(USER_STATUS_HASH_KEY, uid, status);

        const userKey = USER_STATUS_HASH_TTL_KEY + uid;
        await this.redisService.commonCacheRedis.set(userKey, status, {EX: TTL_EXPIRATION_TIME});

        return {[uid]: ONLINE};
    }

    async delStatus(uid: string): Promise<number> {
        return await this.redisService.commonCacheRedis.hDel(USER_STATUS_HASH_KEY, uid);
    }
}
