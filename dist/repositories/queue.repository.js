"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueRepository = exports.QueueRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const log = (0, logger_1.createLogger)('queue-repository');
class QueueRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async addToQueue(data) {
        return this.prisma.queueEntry.create({
            data: {
                userId: data.userId,
                queueType: data.queueType,
                preferences: data.preferences,
            },
        });
    }
    async removeFromQueue(userId) {
        await this.prisma.queueEntry.deleteMany({
            where: { userId },
        });
    }
    async findInQueue(userId) {
        return this.prisma.queueEntry.findFirst({
            where: { userId },
        });
    }
    async getQueueCount(queueType) {
        return this.prisma.queueEntry.count({
            where: { queueType },
        });
    }
    async getOldestInQueue(queueType, limit = 10) {
        return this.prisma.queueEntry.findMany({
            where: { queueType },
            include: { user: { include: { preferences: true } } },
            orderBy: { queuedAt: 'asc' },
            take: limit,
        });
    }
    async getStaleEntries(minutes) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.prisma.queueEntry.findMany({
            where: { queuedAt: { lt: cutoff } },
            include: { user: true },
        });
    }
    async clearQueue(queueType) {
        const result = await this.prisma.queueEntry.deleteMany({
            where: queueType ? { queueType } : undefined,
        });
        return result.count;
    }
}
exports.QueueRepository = QueueRepository;
exports.queueRepository = new QueueRepository();
//# sourceMappingURL=queue.repository.js.map