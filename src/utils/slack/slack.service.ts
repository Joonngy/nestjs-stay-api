import axios from 'axios';
import {Injectable} from '@nestjs/common';

@Injectable()
export class SlackService {
    private readonly webhookUrl: string;

    constructor() {
        this.webhookUrl = '';
    }

    sendMessage(message: string, errorMessage: string, errorStack: string): void {
        const errorLog = `\`\`\`${errorMessage}\n ${errorStack}\n\`\`\``;
        axios.post(this.webhookUrl, {
            text: message,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: errorLog,
                    },
                },
            ],
        });
    }
}
