import { PrismaClient, QueueType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';

const log = createLogger('queue-repository');

export class QueueRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async addToQueue(data: {
    userId: string;
    queueType: QueueType;
    preferences?: Record<string, unknown>;
  }): Promise<Prisma.QueueEntryGetPayload<{}>> {
    return this.prisma.queueEntry.create({
      data: {
        userId: data.userId,
        queueType: data.queueType,
        preferences: data.preferences as Prisma.JsonObject,
      },
    });
  }

  async removeFromQueue(userId: string): Promise<void> {
    await this.prisma.queueEntry.deleteMany({
      where: { userId },
    });
  }

  async findInQueue(userId: string): Promise<Prisma.QueueEntryGetPayload<{}> | null> {
    return this.prisma.queueEntry.findFirst({
      where: { userId },
    });
  }

  async getQueueCount(queueType: QueueType): Promise<number> {
    return this.prisma.queueEntry.count({
      where: { queueType },
    });
  }

  async getOldestInQueue(queueType: QueueType, limit = 10): Promise<Prisma.QueueEntryGetPayload<{
    include: { user: { include: { preferences: true } } };
  }>[]> {
    return this.prisma.queueEntry.findMany({
      where: { queueType },
      include: { user: { include: { preferences: true } } },
      orderBy: { queuedAt: 'asc' },
      take: limit,
    });
  }

  async getStaleEntries(minutes: number): Promise<Prisma.QueueEntryGetPayload<{
    include: { user: true };
  }>[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.queueEntry.findMany({
      where: { queuedAt: { lt: cutoff } },
      include: { user: true },
    });
  }

  async clearQueue(queueType?: QueueType): Promise<number> {
    const result = await this.prisma.queueEntry.deleteMany({
      where: queueType ? { queueType } : undefined,
    });
    return result.count;
  }
}

export const queueRepository = new QueueRepository();