import {PgConfig} from 'src/utils/db/types/pg.slonik';
import {MongoConfig} from 'src/utils/db/types/mg.mongoose';
import {RedisConfig} from 'src/utils/cache/type/redis.service';

type StayConfig = {
    corsWhitelist: string[];
    rwPgConfig: PgConfig;
    roPgConfig: PgConfig;
    mongoConfig: MongoConfig;
    commonRedisConfig: RedisConfig;
    port: {
        api: number;
        websocket: number;
    };
};

export type Config = {
    stayConfig: StayConfig;
};
