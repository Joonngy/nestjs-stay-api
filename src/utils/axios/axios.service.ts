import {Injectable, Logger} from '@nestjs/common';
import axios, {AxiosInstance} from 'axios';

@Injectable()
export default class AxiosService {
    public logger = new Logger(this.constructor.name);

    constructor() {}

    public createClient(baseUrl: string, headers?: Record<string, string>, timeout?: number): AxiosInstance {
        return axios.create({
            baseURL: baseUrl,
            headers: headers,
            timeout: timeout,
        });
    }
}
