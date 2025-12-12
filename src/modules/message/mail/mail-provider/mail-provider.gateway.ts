import {MailSendParams, MailSendResponse, MailProviderStatusResponse} from './mail-provider.type';

export abstract class MailProviderGateway {
    abstract getSupportDomain(): Set<string>;
    abstract checkProviderDomain(domain: string): boolean;
    abstract processRequest(domainName: string, params: MailSendParams): Promise<MailSendResponse>;
    abstract getSendStatus(domainName: string, providerRefId: string): Promise<MailProviderStatusResponse>;
}
