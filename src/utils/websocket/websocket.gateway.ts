import {WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import {RawData, Server, WebSocket} from 'ws';
import {WebsocketChannel} from './websocket.channel';
import {StayWebSocketGatewayClass, WebsocketSubscribeChannelType, WebsocketSubscribeMessage} from 'src/types/websocket.type';
import {WEBSOCKET_CHANNEL_USER_STATUS} from 'src/config/types/constant';
import {Logger} from '@nestjs/common';
import {UserStatusMessage} from 'src/modules/user-status/user-status.message';

@WebSocketGateway()
export class StayWebSocketGateway implements StayWebSocketGatewayClass {
    private readonly logger = new Logger(StayWebSocketGateway.name);
    @WebSocketServer()
    private server: Server;

    channelGateways: Record<string, WebsocketChannel> = {};

    constructor(private readonly userStatusMessage: UserStatusMessage) {}

    onModuleInit() {
        this.registerChannel(WEBSOCKET_CHANNEL_USER_STATUS, this.userStatusMessage);
    }

    private registerChannel(channel: WebsocketSubscribeChannelType, gateway: WebsocketChannel) {
        this.channelGateways[channel] = gateway;
    }

    async handleConnection(client: WebSocket): Promise<void> {
        client.on('message', (data) => this.handleMessage(client, data));
        client.on('pong', () => this.handlePong(client));
    }

    handleDisconnect(client: WebSocket): void {
        for (const gateway in this.channelGateways) {
            this.channelGateways[gateway].deleteClient(client);
        }
    }

    async handleMessage(client: WebSocket, data: RawData): Promise<void> {
        try {
            const message: WebsocketSubscribeMessage = JSON.parse(data.toString());
            const gateway = this.channelGateways[message.channel];

            if (gateway != null) {
                await gateway.handleMessage(client, message);
            } else {
                client.close(4004, 'Bad Subscription Request');
            }
        } catch (error: any) {
            this.logger.error('Websocket handleMessage', (error?.message as string) ?? error);
            client.close(1011, 'Internal Server Error');
        }
    }

    handlePong(client: WebSocket): void {
        this.userStatusMessage.pong(client);
    }
}
