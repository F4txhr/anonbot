"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const logger_1 = require("../config/logger");
const payment_repository_1 = require("../repositories/payment.repository");
const user_repository_1 = require("../repositories/user.repository");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('payment-service');
class PaymentService {
    env = (0, env_1.getEnv)();
    async handleSuccessfulPayment(paymentId, telegramPaymentId) {
        const payment = await payment_repository_1.paymentRepository.findById(paymentId);
        if (!payment) {
            log.error({ paymentId }, 'Payment not found');
            return false;
        }
        if (payment.status === 'COMPLETED') {
            log.warn({ paymentId }, 'Payment already completed');
            return false;
        }
        await payment_repository_1.paymentRepository.complete(paymentId, telegramPaymentId);
        const vipDurationMs = this.env.VIP_DURATION_DAYS * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + vipDurationMs);
        await user_repository_1.userRepository.setVip(payment.userId, expiresAt);
        log.info({ paymentId, userId: payment.userId, expiresAt }, 'VIP activated');
        return true;
    }
    async handleFailedPayment(paymentId) {
        await payment_repository_1.paymentRepository.fail(paymentId);
        log.warn({ paymentId }, 'Payment failed');
    }
    async createPaymentRecord(userId) {
        const payment = await payment_repository_1.paymentRepository.create({
            userId,
            starsAmount: this.env.VIP_PRICE_STARS,
        });
        log.info({ paymentId: payment.id, userId, stars: this.env.VIP_PRICE_STARS }, 'Payment record created');
        return { id: payment.id, amount: this.env.VIP_PRICE_STARS };
    }
    async extendVip(userId, days) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        let currentExpiry = user.vipExpiresAt || new Date();
        if (currentExpiry < new Date()) {
            currentExpiry = new Date();
        }
        const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
        await user_repository_1.userRepository.setVip(userId, newExpiry);
        log.info({ userId, days, newExpiry }, 'VIP extended');
        return newExpiry;
    }
    async revokeVip(userId) {
        await user_repository_1.userRepository.removeVip(userId);
        log.info({ userId }, 'VIP revoked');
    }
    getVipPrice() {
        return this.env.VIP_PRICE_STARS;
    }
    getVipDurationDays() {
        return this.env.VIP_DURATION_DAYS;
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map