import { PrismaClient, Gender, AgeRange, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';
import { generateReferralCode } from '../utils/referral';

const log = createLogger('user-repository');

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findByTelegramId(telegramId: bigint): Promise<Prisma.UserGetPayload<{
    include: { preferences: true }
  }> | null> {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: { preferences: true },
    });
  }

  async findById(id: string): Promise<Prisma.UserGetPayload<{
    include: { preferences: true }
  }> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
  }

  async create(data: {
    telegramId: bigint;
    referrerId?: string;
  }): Promise<Prisma.UserGetPayload<{ include: { preferences: true } }>> {
    const referralCode = generateReferralCode(data.telegramId.toString());

    return this.prisma.user.create({
      data: {
        telegramId: data.telegramId,
        referralCode,
        referrerId: data.referrerId,
        trustScore: 100,
        preferences: {
          create: {},
        },
      },
      include: { preferences: true },
    });
  }

  async updateGender(userId: string, gender: Gender): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { gender },
    });
  }

  async updateAgeRange(userId: string, ageRange: AgeRange): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { ageRange },
    });
  }

  async updateInterests(userId: string, interests: string[]): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { interests },
    });
  }

  async updateCountry(userId: string, country: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { country },
    });
  }

  async updatePreferences(userId: string, preferences: {
    preferredGender?: Gender | null;
    preferredAgeRange?: AgeRange | null;
    preferredCountry?: string | null;
    preferredInterests?: string[];
  }): Promise<void> {
    await this.prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        preferredGender: preferences.preferredGender,
        preferredAgeRange: preferences.preferredAgeRange,
        preferredCountry: preferences.preferredCountry,
        preferredInterests: preferences.preferredInterests ?? [],
      },
      update: {
        preferredGender: preferences.preferredGender,
        preferredAgeRange: preferences.preferredAgeRange,
        preferredCountry: preferences.preferredCountry,
        preferredInterests: preferences.preferredInterests ?? [],
      },
    });
  }

  async updateTrustScore(userId: string, delta: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newScore = Math.max(0, Math.min(100, user.trustScore + delta));
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: newScore },
    });
  }

  async setVip(userId: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVip: true,
        vipExpiresAt: expiresAt,
      },
    });
  }

  async removeVip(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVip: false,
        vipExpiresAt: null,
      },
    });
  }

  async ban(userId: string, type: 'TEMPORARY' | 'PERMANENT', reason: string, expiresAt?: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isBanned: true, banExpiresAt: expiresAt },
      }),
      this.prisma.ban.create({
        data: {
          userId,
          type,
          reason,
          expiresAt,
        },
      }),
    ]);
  }

  async unban(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, banExpiresAt: null },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getVipExpiringSoon(hours: number): Promise<Prisma.UserGetPayload<{}>[]> {
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    return this.prisma.user.findMany({
      where: {
        isVip: true,
        vipExpiresAt: { lte: deadline, gt: new Date() },
      },
    });
  }

  async getActiveUsersCount(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.user.count({
      where: { updatedAt: { gte: oneDayAgo } },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async countVip(): Promise<number> {
    return this.prisma.user.count({
      where: { isVip: true, vipExpiresAt: { gt: new Date() } },
    });
  }

  async findBannedUser(telegramId: bigint): Promise<Prisma.UserGetPayload<{}> | null> {
    return this.prisma.user.findFirst({
      where: {
        telegramId,
        isBanned: true,
        OR: [
          { banExpiresAt: null },
          { banExpiresAt: { gt: new Date() } },
        ],
      },
    });
  }
}

export const userRepository = new UserRepository();