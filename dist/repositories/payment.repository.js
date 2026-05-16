"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = exports.PaymentRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const log = (0, logger_1.createLogger)('payment-repository');
class PaymentRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async create(data) {
        return this.prisma.payment.create({
            data: {
                userId: data.userId,
                starsAmount: data.starsAmount,
                telegramPaymentId: data.telegramPaymentId,
                status: 'PENDING',
            },
        });
    }
    async complete(paymentId, telegramPaymentId) {
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                telegramPaymentId,
                completedAt: new Date(),
            },
        });
    }
    async fail(paymentId) {
        await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'FAILED' },
        });
    }
    async findById(paymentId) {
        return this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
    }
    async findByTelegramPaymentId(telegramPaymentId) {
        return this.prisma.payment.findFirst({
            where: { telegramPaymentId },
        });
    }
    async getUserPayments(userId) {
        return this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async countCompleted() {
        return this.prisma.payment.count({
            where: { status: 'COMPLETED' },
        });
    }
    async getRecentPayments(limit = 20) {
        return this.prisma.payment.findMany({
            where: { status: 'COMPLETED' },
            include: { user: true },
            orderBy: { completedAt: 'desc' },
            take: limit,
        });
    }
}
exports.PaymentRepository = PaymentRepository;
exports.paymentRepository = new PaymentRepository();
//# sourceMappingURL=payment.repository.js.map