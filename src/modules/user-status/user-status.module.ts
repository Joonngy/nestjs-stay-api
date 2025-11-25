import {Module} from '@nestjs/common';
import {CacheModule} from 'src/utils/cache/cache.modules';
import {DbModule} from 'src/utils/db/db.modules';
import {UserStatusMessage} from './user-status.message';
import {UserStatusService} from './user-status.service';
import {UserStatusRepository} from './user-status.repository';

@Module({
    imports: [CacheModule, DbModule],
    controllers: [],
    providers: [UserStatusMessage, UserStatusService, UserStatusRepository],
    exports: [UserStatusMessage],
})
export class UserStatusModule {}
