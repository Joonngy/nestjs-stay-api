// src/utils/queue/bullmq.module.ts

import {FactoryProvider, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Config} from 'src/config/types';
import {BULL_MAIL_QUEUE, BULL_PUSH_QUEUE} from 'src/config/types/constant';
import {BullMqUtil} from './bullmq/bullmq.util';

const emailQueueProvider: FactoryProvider = {
    provide: BULL_MAIL_QUEUE,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<Config>) => {
        const bullMqConfig = configService.get('stayConfig.bullMqConfig', {infer: true});
        const queue = new BullMqUtil(bullMqConfig, BULL_MAIL_QUEUE);
        queue.onModuleInit();
        return queue;
    },
};

const pushQueueProvider: FactoryProvider = {
    provide: BULL_PUSH_QUEUE,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<Config>) => {
        const bullMqConfig = configService.get('stayConfig.bullMqConfig', {infer: true});
        const queue = new BullMqUtil(bullMqConfig, BULL_PUSH_QUEUE);
        queue.onModuleInit();
        return queue;
    },
};

@Module({
    providers: [emailQueueProvider, pushQueueProvider],
    exports: [BULL_MAIL_QUEUE, BULL_PUSH_QUEUE],
})
export class QueueModule {}
