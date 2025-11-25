import {FactoryProvider, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Config} from '../../config/types';
import {DbRepository} from './db.repository';
import {PG_UTIL_DEFAULT_TIMEOUT, READ_ONLY, READ_WRITE, RO_PG_UTIL, RW_PG_UTIL} from 'src/config/types/constant';
import {PgSlonik} from './types/pg.slonik';

const rwPgUtilProvider: FactoryProvider = {
    provide: RW_PG_UTIL,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService<Config>) => {
        const rwPgConfig = configService.get('stayConfig.rwPgConfig', {infer: true});
        const pool = new PgSlonik(rwPgConfig, PG_UTIL_DEFAULT_TIMEOUT, READ_WRITE);
        return pool;
    },
};

const roPgUtilProvider: FactoryProvider = {
    provide: RO_PG_UTIL,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService<Config>) => {
        const roPgConfig = configService.get('stayConfig.roPgConfig', {infer: true});
        const pool = new PgSlonik(roPgConfig, PG_UTIL_DEFAULT_TIMEOUT, READ_ONLY);
        return pool;
    },
};

@Module({
    providers: [rwPgUtilProvider, roPgUtilProvider, DbRepository],
    exports: [RW_PG_UTIL, RO_PG_UTIL, DbRepository],
})
export class DbModule {}
