import {NestFactory} from '@nestjs/core';
import {ConfigService} from '@nestjs/config';
import {AppModule} from './app.module';
import {Config} from './config/types';
import {NestExpressApplication} from '@nestjs/platform-express';
import {HttpExceptionFilter} from './middleware/http-exception.filter';
import {CustomValidationPipe} from './middleware/validation.pipe';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Configuration Setting
    const configService = app.get<ConfigService<Config>>(ConfigService);

    // Set Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('STAY API Docs')
        .setDescription('STAY Service API Documentation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const options: SwaggerDocumentOptions = {
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    };
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig, options);
    SwaggerModule.setup('swagger/stay/docs', app, documentFactory, {
        swaggerOptions: {
            persistAuthorization: true, // 인증 정보 유지 옵션
        },
    });

    // Set global API Prefix Call
    app.setGlobalPrefix('api/v1');

    // Set Validation Pipeline
    app.useGlobalPipes(new CustomValidationPipe({transform: true}));

    // Set Exception Filter
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.listen(configService.get('stayConfig.port.api', {infer: true}), '0.0.0.0');
}
bootstrap();
