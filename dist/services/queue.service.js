"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
exports.createWorker = createWorker;
const bullmq_1 = require("bullmq");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('queue-service');
const QUEUE_NAMES = {
    MATCHMAKING: 'matchmaking',
    VIP_EXPIRY: 'vip-expiry',
    CLEANUP: 'cleanup',
    REFERRAL: 'referral',
};
class QueueService {
    connection;
    queues = new Map();
    constructor() {
        const env = (0, env_1.getEnv)();
        this.connection = { host: env.REDIS_HOST, port: env.REDIS_PORT };
    }
    getQueue(name) {
        let queue = this.queues.get(name);
        if (!queue) {
            queue = new bullmq_1.Queue(name, { connection: this.connection });
            this.queues.set(name, queue);
        }
        return queue;
    }
    async addMatchmakingJob(userId, data = {}) {
        const queue = this.getQueue(QUEUE_NAMES.MATCHMAKING);
        await queue.add('find-match', { userId, ...data });
        log.info({ userId }, 'Matchmaking job added');
    }
    async addVipExpiryJob(userId) {
        const queue = this.getQueue(QUEUE_NAMES.VIP_EXPIRY);
        await queue.add('check-expiry', { userId });
        log.info({ userId }, 'VIP expiry job added');
    }
    async addCleanupJob(type) {
        const queue = this.getQueue(QUEUE_NAMES.CLEANUP);
        await queue.add('cleanup', { type });
        log.info({ type }, 'Cleanup job added');
    }
    async addReferralJob(referralId) {
        const queue = this.getQueue(QUEUE_NAMES.REFERRAL);
        await queue.add('verify', { referralId });
        log.info({ referralId }, 'Referral job added');
    }
    async closeAll() {
        for (const queue of this.queues.values()) {
            await queue.close();
        }
        this.queues.clear();
        log.info('All queues closed');
    }
}
exports.QueueService = QueueService;
exports.queueService = new QueueService();
function createWorker(name, processor, options) {
    const env = (0, env_1.getEnv)();
    const worker = new bullmq_1.Worker(name, async (job) => {
        try {
            await processor(job);
        }
        catch (error) {
            log.error({ err: error, jobId: job.id, name }, 'Job failed');
            throw error;
        }
    }, {
        connection: { host: env.REDIS_HOST, port: env.REDIS_PORT },
        concurrency: options?.concurrency ?? 1,
    });
    worker.on('completed', (job) => {
        log.debug({ jobId: job.id, name }, 'Job completed');
    });
    worker.on('failed', (job, err) => {
        log.error({ jobId: job?.id, name, err }, 'Job failed');
    });
    return worker;
}
//# sourceMappingURL=queue.service.js.map