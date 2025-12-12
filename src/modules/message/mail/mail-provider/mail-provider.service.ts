import {Injectable, Logger} from '@nestjs/common';
import {MailProviderName, MailSendParams, MailSendResponse, MailSendStatusParams} from './mail-provider.type';
import {MailProviderGateway} from './mail-provider.gateway';
import {SmtpClient} from './client/smtp-client';
import {MAIL_PROVIDER_SMTP_SERVER, MAIL_STATUS_FAILED} from 'src/config/types/constant';

@Injectable()
export class MailProviderService {
    private readonly logger = new Logger(MailProviderService.name);
    platformGateways: Record<string, MailProviderGateway> = {};

    constructor(private readonly smtpClient: SmtpClient) {}

    onModuleInit() {
        this.registerGateway(MAIL_PROVIDER_SMTP_SERVER, this.smtpClient);
    }

    registerGateway(sendMethod: MailProviderName, gateway: MailProviderGateway) {
        this.platformGateways[sendMethod] = gateway;
    }

    async processRequest(params: MailSendParams): Promise<MailSendResponse> {
        const gateway = this.platformGateways[params.provider];
        const {provider, domain} = params;

        if (gateway) {
            return await gateway.processRequest(domain, params);
        } else {
            this.logger.error(`c07dd9cd-bcf4-4266-896d-12cb98a66567: No Validation Method Set for ${provider}`);
            return {
                id: null,
                result: false,
                response: {
                    code: '999',
                    result: 'failed',
                    message: `No Validation Method Set ${provider}`,
                },
                status: MAIL_STATUS_FAILED,
            };
        }
    }

    async getSendStatus(providerName: MailProviderName, params: MailSendStatusParams): Promise<any> {
        const gateway = this.platformGateways[providerName];

        if (gateway) {
            return await gateway.getSendStatus(params.domain_name, params.provider_ref_id);
        } else {
            this.logger.error(`70432805-2c9d-4d6a-b0ad-70a802a4c97d: No Validation Method Set for ${providerName}`);
        }
    }
}
