export const $Enums = {
    /**
     * Websocket
     */
    WebsocketConnectType: {
        subscribe: 'subscribe',
        unsubscribe: 'unsubscribe',
    },

    WebsocketSubscribeChannelType: {
        user_status: 'user_status',
    },

    /**
     * User Status
     */
    UserStatusType: {
        online: 'online',
        offline: 'offline',
    },
    /**
     * Mail
     */
    MailProvider: {
        smtp_server: 'smtp_server',
    },

    MailSendStatus: {
        pending: 'pending',
        queued: 'queued',
        failed: 'failed',
        delivered: 'delivered',
        bounced: 'bounced',
        opened: 'opened',
    },
};
