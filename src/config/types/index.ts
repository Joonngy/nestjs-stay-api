import {PgConfig} from 'src/utils/db/types/pg.slonik';

type StayConfig = {
    corsWhitelist: string[];
    rwPgConfig: PgConfig;
    roPgConfig: PgConfig;
    port: {
        api: number;
        websocket: number;
    };
};

export type Config = {
    stayConfig: StayConfig;
};
