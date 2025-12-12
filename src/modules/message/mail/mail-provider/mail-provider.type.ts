import {$Enums} from 'src/types/enum';

export type MailProviderName = keyof typeof $Enums.MailProvider;
export type MailSendStatus = keyof typeof $Enums.MailSendStatus;
export const QUEUED: MailSendStatus = 'queued';
export const DELIVERED: MailSendStatus = 'delivered';
export const FAILED: MailSendStatus = 'failed';

export type MailSendParams = {
    provider?: MailProviderName;
    domain?: string;
    from: string;
    to: string[];
    bcc?: string;
    subject: string;
    content: string;
};

export type MailSendResponse = {
    id: string;
    result: boolean;
    response: MailProviderResponse;
    status: MailSendStatus;
};

export type MailProviderResponse = {
    code: string;
    result: string;
    message: string;
};

export type MailStatusCreateParams = {
    mail_history_ref_id: string;
    domain_name: string;
    provider_name: MailProviderName;
    attempt: number;
};

export type MailStatusUpdateParams = {
    id: string;
    provider_ref_id: string;
    send_status: MailSendStatus;
    response: MailProviderResponse;
    update_time?: Date;
};

export type MailProviderStatusResponse = {
    items: {
        event: string;
        message: {
            headers: {
                'message-id': string;
            };
        };
        'delivery-status': {
            code: number;
            message: string;
            description: string;
        };
    }[];
};

export type MailDeliveryUpdateParams = Omit<MailStatusUpdateParams, 'provider_ref_id'>;

// export type MailSendStatusType = {
//     id: string;
//     domain_name: string;
//     provider_name: MailProviderName;
//     provider_ref_id: string;
//     mail_history: {
//         email: string;
//     };
// };

export type MailSendStatusParams = {
    domain_name: string;
    provider_ref_id: string;
};

export interface returnMailStatus {
    user_id: string;
    send_status: string;
}

export interface MailSendStatisticType {
    pending: number;
    queued: number;
    success: number;
    failed: number;
}

type MailStatusCount = string;
export interface MailStatusCountNotificationParams {
    title: string;
    header: string;
    body: {[status: string]: MailStatusCount};
}

export interface GetMailStatusCountStatisticResponse {
    status: string;
    count: string;
}
