import {$Enums} from 'src/types/enum';

export const USER_STATUS_HASH_KEY = 'stay:user:status';
export const USER_STATUS_HASH_TTL_KEY = USER_STATUS_HASH_KEY + ':ttl:';
export const TTL_EXPIRATION_TIME = 15;
export const PING_INTERVAL = 10000;

export type UserStatusType = keyof typeof $Enums.UserStatusType;
export const ONLINE: UserStatusType = 'online';
export const OFFLINE: UserStatusType = 'offline';

export type BroadcastUserStatusInfo = {[key: string]: UserStatusType};

export interface UserStatusInfo {
    user_uid: string;
    status: UserStatusType;
}
