import { createLogger } from '../config/logger';
import { paymentRepository } from '../repositories/payment.repository';
import { userRepository } from '../repositories/user.repository';
import { getEnv } from '../config/env';

const log = createLogger('payment-service');

export class PaymentService {
  private env = getEnv();

  async handleSuccessfulPayment(paymentId: string, telegramPaymentId: string): Promise<boolean> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      log.error({ paymentId }, 'Payment not found');
      return false;
    }

    if (payment.status === 'COMPLETED') {
      log.warn({ paymentId }, 'Payment already completed');
      return false;
    }

    await paymentRepository.complete(paymentId, telegramPaymentId);

    const vipDurationMs = this.env.VIP_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + vipDurationMs);

    await userRepository.setVip(payment.userId, expiresAt);

    log.info({ paymentId, userId: payment.userId, expiresAt }, 'VIP activated');

    return true;
  }

  async handleFailedPayment(paymentId: string): Promise<void> {
    await paymentRepository.fail(paymentId);
    log.warn({ paymentId }, 'Payment failed');
  }

  async createPaymentRecord(userId: string): Promise<{ id: string; amount: number }> {
    const payment = await paymentRepository.create({
      userId,
      starsAmount: this.env.VIP_PRICE_STARS,
    });

    log.info({ paymentId: payment.id, userId, stars: this.env.VIP_PRICE_STARS }, 'Payment record created');

    return { id: payment.id, amount: this.env.VIP_PRICE_STARS };
  }

  async extendVip(userId: string, days: number): Promise<Date> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    let currentExpiry = user.vipExpiresAt || new Date();
    if (currentExpiry < new Date()) {
      currentExpiry = new Date();
    }

    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    await userRepository.setVip(userId, newExpiry);

    log.info({ userId, days, newExpiry }, 'VIP extended');
    return newExpiry;
  }

  async revokeVip(userId: string): Promise<void> {
    await userRepository.removeVip(userId);
    log.info({ userId }, 'VIP revoked');
  }

  getVipPrice(): number {
    return this.env.VIP_PRICE_STARS;
  }

  getVipDurationDays(): number {
    return this.env.VIP_DURATION_DAYS;
  }
}

export const paymentService = new PaymentService();