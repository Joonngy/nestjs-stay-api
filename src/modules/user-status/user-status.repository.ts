import {Injectable} from '@nestjs/common';
import {DbRepository} from 'src/utils/db/db.repository';
import {sql} from 'slonik';

@Injectable()
export class UserStatusRepository extends DbRepository {
    constructor() {
        super();
    }

    async checkUserInfo(userId: string): Promise<boolean> {
        try {
            return await this.roPgSlonik.pool.exists(sql.unsafe`
                SELECT
                    1
                FROM
                    public.users
                WHERE
                    id = ${userId}
            `);
        } catch (error) {
            throw error;
        }
    }
}
