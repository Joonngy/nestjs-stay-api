import {createPool, sql, type DatabasePool, createTypeParserPreset, type Interceptor, ClientConfigurationInput} from 'slonik';
import {PoolConfig} from 'pg';
import {PgConnectMode, READ_WRITE} from 'src/config/types/constant';

const DEFAULT_TIMEOUT = 5000;

const pgUtilPool: {[key: string]: PgSlonik} = {};
class QueryTimeoutError extends Error {}

export type PgConfigBase = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?:
        | boolean
        | {
              rejectUnauthorized?: boolean;
              ca?: string;
              cert?: string;
              key?: string;
          };
};

export type PgConfig = PgConfigBase & {
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    max?: number;
    searchPath?: string;
};

export type DbConfig = {
    connectionString: string;
    idleTimeout: number; // ms, default 30000

    /** Optional tuning */
    connectionTimeoutMs?: number; // ms, default 5000
    maximumPoolSize?: number; // default 10
    statementTimeoutMs?: number; // ms
    interceptors?: Interceptor[];
};

export class PgSlonik {
    private mode: PgConnectMode;
    private pgConfig: PoolConfig;
    private dbConfig: DbConfig;
    private slonikPool: DatabasePool;

    constructor(config: PgConfig, idleTimeout: number, mode: PgConnectMode) {
        if (config == null) {
            throw new Error('PostgreSQL configuration not found in config');
        }

        this.mode = mode;

        const roInterceptor: Interceptor | undefined =
            this.mode === 'READ_ONLY'
                ? {
                      name: 'read-only-enforcer',
                      async afterPoolConnection(connectionCtx, connection) {
                          await connection.query(sql.typeAlias('void')`
                              SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY
                          `);
                          await connection.query(sql.typeAlias('void')`
                            SET default_transaction_read_only = on
                        `);
                          return null;
                      },
                  }
                : undefined;

        this.pgConfig = config;

        this.dbConfig = {
            connectionString: this.buildConnectionString(this.pgConfig),
            idleTimeout,
            interceptors: roInterceptor ? [roInterceptor] : undefined,
        };
    }

    async onModuleInit() {
        const cfg = this.dbConfig;

        try {
            const opts: ClientConfigurationInput = {
                captureStackTrace: true, // should be false in production
                connectionRetryLimit: 5,
                connectionTimeout: cfg.connectionTimeoutMs ?? 5_000,
                idleInTransactionSessionTimeout: 'DISABLE_TIMEOUT',
                idleTimeout: cfg.idleTimeout ?? 30_000,
                interceptors: cfg.interceptors,
                maximumPoolSize: cfg.maximumPoolSize ?? 10,
                statementTimeout: cfg.statementTimeoutMs ?? 'DISABLE_TIMEOUT',
                typeParsers: [...createTypeParserPreset()],
            };
            this.slonikPool = await createPool(cfg.connectionString, opts);
        } catch (error) {
            console.error('Failed to connect to PostgreSQL', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.slonikPool?.end();
    }

    private buildConnectionString(cfg: PgConfig): string {
        const auth = `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}`;
        const base = `postgres://${auth}@${cfg.host}:${cfg.port}/${cfg.database}`;
        if (cfg.ssl) {
            return `${base}?sslmode=require`;
        }
        return base;
    }

    get pool(): DatabasePool {
        return this.slonikPool;
    }
}

export {sql};
