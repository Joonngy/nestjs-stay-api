import {WebSocket} from 'ws';
import {
    WebsocketCloseMessage,
    WebsocketConnectType,
    WebsocketSubscribeChannelType,
    WebsocketSubscribeMessage,
} from 'src/types/websocket.type';
import {BroadcastUserStatusInfo} from 'src/modules/user-status/user-status.type';

interface TrackedClient {
    socket: WebSocket;
    userUid: string;
    isAlive: boolean;
}

export abstract class WebsocketChannel {
    clients = new Map<WebSocket, TrackedClient>();

    deleteClient(client: WebSocket) {
        const meta = this.clients.get(client);
        if (meta != null) {
            console.log(`${meta.userUid} = Disconnected`);
            this.clients.delete(client);
        }
    }

    abstract handleMessage(client: WebSocket, message: WebsocketSubscribeMessage): Promise<void>;

    async broadcastStatus(connectedClient: WebSocket = null, channel: WebsocketSubscribeChannelType, broadcastInfo: any): Promise<void> {
        this.clients.forEach((client) => {
            if (connectedClient != null && client.socket === connectedClient) return;
            if (client.socket.readyState === WebSocket.OPEN) {
                this.sendClientMessage(client.socket, channel, broadcastInfo);
            }
        });
    }

    sendClientMessage(client: WebSocket, channel: WebsocketSubscribeChannelType, data: BroadcastUserStatusInfo | WebsocketConnectType) {
        client.send(JSON.stringify({channel, data}));
    }

    handleClose(client: WebSocket, data: WebsocketCloseMessage) {
        client.close(data.status, `${data.name} : ${data.message}`);
    }
}
