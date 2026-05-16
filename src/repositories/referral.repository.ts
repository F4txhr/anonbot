import { PrismaClient, ReferralStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';

const log = createLogger('referral-repository');

export class ReferralRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: {
    referrerId: string;
    referredUserId: string;
  }): Promise<Prisma.ReferralGetPayload<{}>> {
    return this.prisma.referral.create({
      data: {
        referrerId: data.referrerId,
        referredUserId: data.referredUserId,
        status: 'PENDING',
      },
    });
  }

  async markQualified(referralId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: 'QUALIFIED' },
    });
  }

  async markRewarded(referralId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'REWARDED',
        rewardedAt: new Date(),
      },
    });
  }

  async markRejected(referralId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: 'REJECTED' },
    });
  }

  async findByReferredUser(referredUserId: string): Promise<Prisma.ReferralGetPayload<{
    include: { referrer: true };
  }> | null> {
    return this.prisma.referral.findUnique({
      where: { referredUserId },
      include: { referrer: true },
    });
  }

  async getReferrerStats(referrerId: string): Promise<{
    total: number;
    pending: number;
    qualified: number;
    rewarded: number;
  }> {
    const [total, pending, qualified, rewarded] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId } }),
      this.prisma.referral.count({ where: { referrerId, status: 'PENDING' } }),
      this.prisma.referral.count({ where: { referrerId, status: 'QUALIFIED' } }),
      this.prisma.referral.count({ where: { referrerId, status: 'REWARDED' } }),
    ]);

    return { total, pending, qualified, rewarded };
  }

  async getPendingReferrals(): Promise<Prisma.ReferralGetPayload<{
    include: { referredUser: true };
  }>[]> {
    return this.prisma.referral.findMany({
      where: { status: 'PENDING' },
      include: { referredUser: true },
    });
  }
}

export const referralRepository = new ReferralRepository();