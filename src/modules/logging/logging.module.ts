import {Module} from '@nestjs/common';
import {LoggingService} from './logging.service';
import {DbModule} from 'src/utils/db/db.modules';

@Module({
    imports: [DbModule],
    providers: [LoggingService],
    exports: [LoggingService],
})
export class LoggingModule {}
