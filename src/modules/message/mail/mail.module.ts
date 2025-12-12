import {Module} from '@nestjs/common';
import {MailService} from './mail.service';
import {DbModule} from 'src/utils/db/db.modules';

@Module({
    imports: [DbModule],
    controllers: [],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
