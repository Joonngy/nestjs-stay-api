import {Module} from '@nestjs/common';
import {S3Controller} from './s3.controller';
import {S3Service} from './s3.service';
import {MulterModule} from '@nestjs/platform-express';
import {DbModule} from 'src/utils/db/db.modules';
import {CacheModule} from 'src/utils/cache/cache.modules';

@Module({
    imports: [
        MulterModule.register({
            limits: {
                fileSize: 20 * 1024 * 1024, // 최대 10MB 보다 조금 넉넉히
            },
        }),
        DbModule,
        CacheModule,
    ],
    controllers: [S3Controller],
    providers: [S3Service],
    exports: [S3Service],
})
export class S3Module {}
