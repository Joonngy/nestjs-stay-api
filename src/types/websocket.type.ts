import {$Enums} from './enum';
import {RawData} from 'ws';
import {OnGatewayConnection, OnGatewayDisconnect} from '@nestjs/websockets';

export abstract class StayWebSocketGatewayClass implements OnGatewayConnection, OnGatewayDisconnect {
    abstract handleConnection(client: WebSocket): Promise<void>;
    abstract handleDisconnect(client: WebSocket): void;
    abstract handleMessage(client: WebSocket, data: RawData): Promise<void>;
    abstract handlePong(client: WebSocket): void;
}

export type WebsocketConnectType = keyof typeof $Enums.WebsocketConnectType;
export type WebsocketSubscribeChannelType = keyof typeof $Enums.WebsocketSubscribeChannelType;

export type WebsocketSubscribeMessage = {
    connect_type: WebsocketConnectType;
    channel: WebsocketSubscribeChannelType;
    user_uid?: string;
    reset?: boolean;
};

export type WebsocketCloseMessage = {
    status: number;
    name: string;
    message: string;
};
