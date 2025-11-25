import {WebSocket} from 'ws';
import {Injectable} from '@nestjs/common';
import {WebsocketCloseMessage, WebsocketSubscribeMessage} from 'src/types/websocket.type';
import {WEBSOCKET_CHANNEL_USER_STATUS, WEBSOCKET_SUBSCRIBE, WEBSOCKET_UNSUBSCRIBE} from 'src/config/types/constant';
import {BroadcastUserStatusInfo, OFFLINE, ONLINE, PING_INTERVAL, USER_STATUS_HASH_TTL_KEY} from './user-status.type';
import {UserStatusService} from './user-status.service';
import {WebsocketChannel} from 'src/utils/websocket/websocket.channel';

@Injectable()
export class UserStatusMessage extends WebsocketChannel {
    constructor(private readonly userStatusService: UserStatusService) {
        super();
    }

    async onModuleInit() {
        setInterval(() => this.ping(), PING_INTERVAL);
        await this.userStatusService.redisSubscriberInit(this.handleRedisExpiration.bind(this));
    }

    private async subscribeMessage(client: WebSocket, userUid: string = null, reset: boolean) {
        let dataInfo: BroadcastUserStatusInfo = {};
        if (userUid != null) {
            // 본인의 상태값 온라인으로 설정
            dataInfo = await this.userStatusService.setStatus(userUid, ONLINE);

            // 본인의 온라인 방송
            const broadcastInfo: BroadcastUserStatusInfo = {};
            broadcastInfo[userUid] = ONLINE;
            this.broadcastStatus(client, WEBSOCKET_CHANNEL_USER_STATUS, broadcastInfo);
        }

        // 클라이언트 리스트 추가
        this.clients.set(client, {socket: client, userUid, isAlive: true});

        // 전체 Active 한 유저 상태값 전달
        if (reset === true) {
            const onlineUsers = await this.userStatusService.getOnlineUsers();
            this.sendClientMessage(client, WEBSOCKET_CHANNEL_USER_STATUS, onlineUsers);
        } else {
            this.sendClientMessage(client, WEBSOCKET_CHANNEL_USER_STATUS, dataInfo);
        }
    }

    private async unsubscribeMessage(client: WebSocket, userUid: string) {
        const tracked = this.clients.get(client);
        if (tracked != null) {
            if (userUid != null) {
                // 본인의 상태값 오프라인으로 설정
                await this.userStatusService.delStatus(userUid);

                // 본인의 오프라인을 방송
                const broadcastInfo: BroadcastUserStatusInfo = {};
                broadcastInfo[userUid] = OFFLINE;
                this.broadcastStatus(client, WEBSOCKET_CHANNEL_USER_STATUS, broadcastInfo);
            }

            // 클라이언트 리스트 삭제
            this.clients.delete(client);
        }

        // Unsubscribe 성공 메시지 전달
        this.sendClientMessage(client, WEBSOCKET_CHANNEL_USER_STATUS, WEBSOCKET_UNSUBSCRIBE);
    }

    async handleMessage(client: WebSocket, message: WebsocketSubscribeMessage): Promise<void> {
        try {
            const {connect_type: connectType, user_uid: userUid, reset} = message;
            // console.log(`UserStatusMessage: ${connectType}-${userUid}`);

            // Optional Case 추가 - 유저 로그인 안한 상태에서 다른 유저의 Online정보를 가져옴
            if (userUid == null) {
                if (connectType === WEBSOCKET_SUBSCRIBE) {
                    this.subscribeMessage(client, null, true);
                } else if (connectType === WEBSOCKET_UNSUBSCRIBE) {
                    this.unsubscribeMessage(client, null);
                }
                return;
            }

            // 유저 존재 확인
            const userExists = await this.userStatusService.checkUserInfo(userUid);

            if (userExists == null) {
                const error: WebsocketCloseMessage = {name: 'user-status', status: 4001, message: 'invalid user_uid format'};
                this.handleClose(client, error);
                return;
            } else if (userExists === false) {
                const error: WebsocketCloseMessage = {name: 'user-status', status: 4004, message: 'not user_uid found'};
                this.handleClose(client, error);
                return;
            }

            if (connectType === WEBSOCKET_SUBSCRIBE) {
                this.subscribeMessage(client, userUid, reset);
            } else if (connectType === WEBSOCKET_UNSUBSCRIBE) {
                this.unsubscribeMessage(client, userUid);
            }
        } catch (error) {
            throw error;
        }
    }

    async ping(): Promise<void> {
        // console.log(`UserStatusMessage: Checking Client : ${this.clients.size}`);
        this.clients.forEach(async (client) => {
            if (client.isAlive === false) {
                this.clients.delete(client.socket);
                return;
            }
            client.isAlive = false;
            client.socket.ping();
            // console.log(`UserStatusMessage: ${client.userUid} : Client Pinged`);
        });
    }

    async pong(client: WebSocket): Promise<void> {
        const meta = this.clients.get(client);
        try {
            if (meta == null) {
                console.error('a88341ec-4d35-4292-b78e-018a1627d5b1');
                console.log(client);
                return;
            }
            meta.isAlive = true;
            if (meta?.userUid != null) {
                // console.log(`UserStatusMessage: ${meta.userUid} : Client Ponged`);
                await this.userStatusService.setStatus(meta.userUid, ONLINE);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // 레디스 TTL 만료 Event에서 처리
    private async handleRedisExpiration(expiredKey: string) {
        if (expiredKey.startsWith(USER_STATUS_HASH_TTL_KEY)) {
            // console.log(`UserStatusMessage: Redis Expired : ${expiredKey}`);
            const userUid = expiredKey.split(':')[4];

            const result = await this.userStatusService.delStatus(userUid);

            if (result > 0) {
                const broadcastInfo: BroadcastUserStatusInfo = {};
                broadcastInfo[userUid] = OFFLINE;
                this.broadcastStatus(null, WEBSOCKET_CHANNEL_USER_STATUS, broadcastInfo);
            }
        }
    }
}
