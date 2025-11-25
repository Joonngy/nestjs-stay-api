import {MiddlewareConsumer, Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {configuration} from './config/configuration';
import {DbModule} from './utils/db/db.modules';
import {UsersModule} from './modules/users/users.module';
import {LoggerMiddleware} from './middleware/logger.middleware';
import { LoggingModule } from './modules/logging/logging.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            cache: true,
            isGlobal: true,
            ignoreEnvVars: false,
            ignoreEnvFile: false,
        }),
        DbModule,
        LoggingModule,
        UsersModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
