import {FactoryProvider, Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Config} from 'src/config/types';
import {SQS_UTIL} from 'src/config/types/constant';
import {SqsUtil} from './sqs.util';

const sqsUtilProvider: FactoryProvider = {
    provide: SQS_UTIL,
    inject: [ConfigService],
    useFactory: (configService: ConfigService<Config>) => {
        const sqsConfig = configService.get('stayConfig.aws.sqsConfig', {infer: true});
        const sqsUtil = new SqsUtil(sqsConfig, 'stay-sqs');
        return sqsUtil;
    },
};

@Module({
    providers: [sqsUtilProvider],
    exports: [SQS_UTIL],
})
export class SqsModule {}
