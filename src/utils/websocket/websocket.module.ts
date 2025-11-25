import {Module} from '@nestjs/common';
import {StayWebSocketGateway} from './websocket.gateway';

@Module({
    imports: [],
    controllers: [],
    providers: [StayWebSocketGateway],
    exports: [StayWebSocketGateway],
})
export class WebsocketGatewayModule {}
