import Redis from 'ioredis';
export declare function getRedis(): Redis;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export declare function healthCheckRedis(): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map