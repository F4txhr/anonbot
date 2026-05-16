import { PrismaClient, ReportReason, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createLogger } from '../config/logger';

const log = createLogger('report-repository');

export class ReportRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: {
    reporterId: string;
    targetId: string;
    reason: ReportReason;
  }): Promise<Prisma.ReportGetPayload<{}>> {
    return this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        targetId: data.targetId,
        reason: data.reason,
      },
    });
  }

  async getReportsForUser(userId: string): Promise<Prisma.ReportGetPayload<{
    include: { reporter: true };
  }>[]> {
    return this.prisma.report.findMany({
      where: { targetId: userId },
      include: { reporter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countReportsAgainstUser(userId: string): Promise<number> {
    return this.prisma.report.count({
      where: { targetId: userId },
    });
  }

  async count(): Promise<number> {
    return this.prisma.report.count();
  }

  async getRecentReports(limit = 50): Promise<Prisma.ReportGetPayload<{
    include: { reporter: true; target: true };
  }>[]> {
    return this.prisma.report.findMany({
      include: { reporter: true, target: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const reportRepository = new ReportRepository();