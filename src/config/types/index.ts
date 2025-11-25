import {PgConfig} from 'src/utils/db/types/pg.slonik';
import {MongoConfig} from 'src/utils/db/types/mg.mongoose';

type StayConfig = {
    corsWhitelist: string[];
    rwPgConfig: PgConfig;
    roPgConfig: PgConfig;
    mongoConfig: MongoConfig;
    port: {
        api: number;
        websocket: number;
    };
};

export type Config = {
    stayConfig: StayConfig;
};
