import {Inject, Injectable} from '@nestjs/common';
import {DatabaseTransactionConnection, QueryResultRow} from 'slonik';
import {RO_PG_UTIL, RW_PG_UTIL} from 'src/config/types/constant';
import {PgSlonik} from './types/pg.slonik';

@Injectable()
export class DbRepository {
    @Inject(RW_PG_UTIL)
    protected readonly pgSlonik: PgSlonik;

    @Inject(RO_PG_UTIL)
    protected readonly roPgSlonik: PgSlonik;

    async transaction<T>(fn: (conn: DatabaseTransactionConnection) => Promise<T>) {
        return await this.pgSlonik.pool.transaction(fn);
    }
}
