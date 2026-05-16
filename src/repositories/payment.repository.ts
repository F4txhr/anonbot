import { PrismaClient, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';

const log = createLogger('payment-repository');

export class PaymentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: {
    userId: string;
    starsAmount: number;
    telegramPaymentId?: string;
  }): Promise<Prisma.PaymentGetPayload<{}>> {
    return this.prisma.payment.create({
      data: {
        userId: data.userId,
        starsAmount: data.starsAmount,
        telegramPaymentId: data.telegramPaymentId,
        status: 'PENDING',
      },
    });
  }

  async complete(paymentId: string, telegramPaymentId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        telegramPaymentId,
        completedAt: new Date(),
      },
    });
  }

  async fail(paymentId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' },
    });
  }

  async findById(paymentId: string): Promise<Prisma.PaymentGetPayload<{}> | null> {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }

  async findByTelegramPaymentId(telegramPaymentId: string): Promise<Prisma.PaymentGetPayload<{}> | null> {
    return this.prisma.payment.findFirst({
      where: { telegramPaymentId },
    });
  }

  async getUserPayments(userId: string): Promise<Prisma.PaymentGetPayload<{}>[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countCompleted(): Promise<number> {
    return this.prisma.payment.count({
      where: { status: 'COMPLETED' },
    });
  }

  async getRecentPayments(limit = 20): Promise<Prisma.PaymentGetPayload<{
    include: { user: true };
  }>[]> {
    return this.prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      include: { user: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }
}

export const paymentRepository = new PaymentRepository();