import { PrismaClient, MatchEndedReason, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';

const log = createLogger('match-repository');

export class MatchRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(userAId: string, userBId: string): Promise<Prisma.MatchGetPayload<{}>> {
    return this.prisma.match.create({
      data: {
        userAId,
        userBId,
      },
    });
  }

  async findById(matchId: string): Promise<Prisma.MatchGetPayload<{}> | null> {
    return this.prisma.match.findUnique({
      where: { id: matchId },
    });
  }

  async findActiveMatch(userId: string): Promise<Prisma.MatchGetPayload<{}> | null> {
    return this.prisma.match.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        endedAt: null,
      },
    });
  }

  async findActiveMatchWithUsers(userId: string): Promise<Prisma.MatchGetPayload<{
    include: { userA: true; userB: true };
  }> | null> {
    return this.prisma.match.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        endedAt: null,
      },
      include: { userA: true, userB: true },
    });
  }

  async endMatch(matchId: string, reason: MatchEndedReason): Promise<void> {
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        endedAt: new Date(),
        endedReason: reason,
      },
    });
  }

  async getMatchPartner(matchId: string, userId: string): Promise<string | null> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) return null;

    if (match.userAId === userId) return match.userBId;
    if (match.userBId === userId) return match.userAId;

    return null;
  }

  async getMatchByUserId(userId: string): Promise<Prisma.MatchGetPayload<{
    include: { userA: true; userB: true };
  }> | null> {
    return this.prisma.match.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        endedAt: null,
      },
      include: { userA: true, userB: true },
    });
  }

  async countMatches(): Promise<number> {
    return this.prisma.match.count();
  }

  async countActiveMatches(): Promise<number> {
    return this.prisma.match.count({
      where: { endedAt: null },
    });
  }

  async countUserMatches(userId: string): Promise<number> {
    const countA = await this.prisma.match.count({ where: { userAId: userId } });
    const countB = await this.prisma.match.count({ where: { userBId: userId } });
    return countA + countB;
  }

  async getStaleMatches(minutes: number): Promise<Prisma.MatchGetPayload<{}>[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.match.findMany({
      where: {
        endedAt: null,
        startedAt: { lt: cutoff },
      },
    });
  }

  async getUserMatchHistory(userId: string, limit = 10): Promise<Prisma.MatchGetPayload<{}>[]> {
    return this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        endedAt: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}

export const matchRepository = new MatchRepository();