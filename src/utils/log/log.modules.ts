import util from 'util';
import winston from 'winston';

export type LogLevel = 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

type Config = {
    console?: {
        minlevel?: LogLevel;
    };
    files?: {
        filename: string;
        minlevel?: LogLevel;
    }[];
};

let instances: Map<Config | null, LogUtil> = new Map();

export default class LogUtil {
    _winstonLogger: any;

    constructor(option?: Config) {
        this._winstonLogger = winston.createLogger({
            levels: winston.config.syslog.levels,
            format: winston.format.simple(),
        });

        if (option != null) {
            if (option.console != null) {
                this._winstonLogger.add(
                    new winston.transports.Console({
                        level: option.console.minlevel,
                    }),
                );
            }
        } else {
            this._winstonLogger.add(
                new winston.transports.Console({
                    level: 'info',
                }),
            );
        }
    }

    static getInstance(option?: Config): LogUtil {
        if (option === undefined) {
            option = null;
        }

        let instance = instances.get(option);

        if (!instance) {
            instance = new LogUtil(option);
            instances.set(option, instance);
        }

        return instance;
    }

    log(level: LogLevel, ...msgs: any[]) {
        this._winstonLogger.log(level, util.format(...msgs));
        for (const msg of msgs) {
            if (msg instanceof Error) {
                this._winstonLogger.log('debug', msg, msg.stack);
            }
        }
    }

    emerg(...msg: any[]) {
        this.log('emerg', ...msg);
    }

    alert(...msg: any[]) {
        this.log('alert', ...msg);
    }

    crit(...msg: any[]) {
        this.log('crit', ...msg);
    }

    error(...msg: any[]) {
        this.log('error', ...msg);
    }

    warning(...msg: any[]) {
        this.log('warning', ...msg);
    }

    notice(...msg: any[]) {
        this.log('notice', ...msg);
    }

    info(...msg: any[]) {
        this.log('info', ...msg);
    }

    debug(...msg: any[]) {
        this.log('debug', ...msg);
    }
}

export {LogUtil};
