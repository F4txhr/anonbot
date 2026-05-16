"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
exports.healthCheckRedis = healthCheckRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
const env_1 = require("./env");
const log = (0, logger_1.createLogger)('redis');
let redis = null;
function getRedis() {
    if (redis)
        return redis;
    const env = (0, env_1.getEnv)();
    redis = new ioredis_1.default({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 3) {
                log.error('Redis connection failed after 3 retries');
                return null;
            }
            return Math.min(times * 100, 3000);
        },
        reconnectOnError: (err) => {
            log.error({ err }, 'Redis reconnect on error');
            return true;
        },
    });
    redis.on('connect', () => {
        log.info('Redis connected');
    });
    redis.on('error', (err) => {
        log.error({ err }, 'Redis error');
    });
    redis.on('reconnecting', () => {
        log.warn('Redis reconnecting');
    });
    return redis;
}
async function connectRedis() {
    const r = getRedis();
    await r.ping();
    log.info('Redis health check passed');
}
async function disconnectRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
        log.info('Redis disconnected');
    }
}
async function healthCheckRedis() {
    try {
        const r = getRedis();
        const result = await r.ping();
        return result === 'PONG';
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=redis.js.map