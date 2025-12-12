import {Injectable, Logger} from '@nestjs/common';
import {MailProviderGateway} from '../mail-provider.gateway';
import {ConfigService} from '@nestjs/config';
import {Config, SmtpConfig} from 'src/config/types';
import {MailSendParams, MailSendResponse, MailProviderStatusResponse, QUEUED, FAILED} from '../mail-provider.type';
import AxiosService from 'src/utils/axios/axios.service';
import {AxiosInstance} from 'axios';
import {promiseDelay} from 'src/utils/tools/tools.util';
import {$Enums} from 'src/types/enum';

@Injectable()
export class SmtpClient implements MailProviderGateway {
    private readonly logger = new Logger(SmtpClient.name);
    private client: AxiosInstance;
    private readonly smtpConfig: SmtpConfig;
    private readonly domainList: Set<string> = new Set();

    constructor(
        private readonly configService: ConfigService<Config>,
        private readonly axiosService: AxiosService,
    ) {
        this.smtpConfig = configService.get('stayConfig.message.mail.smtpConfig', {infer: true});

        if (!this.smtpConfig) {
            throw new Error('SmtpConfig configuration is required');
        }

        this.client = this.axiosService.createClient(this.smtpConfig.host + ':' + this.smtpConfig.port);
    }

    getSupportDomain(): Set<string> {
        return this.domainList;
    }

    checkProviderDomain(domain: string): boolean {
        if (this.domainList.has(domain)) {
            return true;
        }

        return false;
    }

    async processRequest(domain: string, params: MailSendParams): Promise<MailSendResponse> {
        const {to, bcc, subject, from, content} = params;

        const sendData = {
            from,
            to,
            bcc,
            subject,
            html: content,
            'o:dkim': true,
        };

        if (parseInt(process.env.DEVELOPMENT_MODE)) {
            try {
                await promiseDelay(200);
                return {
                    id: '<aaaaaaaaaaa-id@example.com>',
                    result: true,
                    response: {code: '250', result: QUEUED, message: 'No Error'},
                    status: QUEUED,
                };
            } catch (error) {
                return {
                    id: 'Function-Failed',
                    result: false,
                    response: {
                        code: '999',
                        result: 'Function-Failed',
                        message: JSON.stringify(error),
                    },
                    status: FAILED,
                };
            }
        }
    }

    async getSendStatus(domainName: string, providerRefId: string): Promise<MailProviderStatusResponse> {
        if (parseInt(process.env.DEVELOPMENT_MODE)) {
            try {
                await new Promise((r) => setTimeout(r, 200));
                const response = {
                    items: [
                        {
                            event: 'delivered',
                            message: {
                                headers: {
                                    'message-id': 'aaaaaaaaaaa-id@example.com',
                                },
                            },
                            'delivery-status': {
                                code: 250,
                                message: 'OK',
                                description: 'Message delivered successfully',
                            },
                        },
                    ],
                };
                return response;
            } catch (e: any) {
                const response = {
                    items: [
                        {
                            event: 'failed',
                            message: {
                                headers: {
                                    'message-id': '<aaaaaaaaaaa-id@example.com>',
                                },
                            },
                            'delivery-status': {
                                code: 999,
                                message: 'failed',
                                description: 'Message delivered successfully',
                            },
                        },
                    ],
                };
                return response;
            }
        }
    }
}
