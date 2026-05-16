"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRepository = exports.ReportRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const log = (0, logger_1.createLogger)('report-repository');
class ReportRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async create(data) {
        return this.prisma.report.create({
            data: {
                reporterId: data.reporterId,
                targetId: data.targetId,
                reason: data.reason,
            },
        });
    }
    async getReportsForUser(userId) {
        return this.prisma.report.findMany({
            where: { targetId: userId },
            include: { reporter: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async countReportsAgainstUser(userId) {
        return this.prisma.report.count({
            where: { targetId: userId },
        });
    }
    async count() {
        return this.prisma.report.count();
    }
    async getRecentReports(limit = 50) {
        return this.prisma.report.findMany({
            include: { reporter: true, target: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
exports.ReportRepository = ReportRepository;
exports.reportRepository = new ReportRepository();
//# sourceMappingURL=report.repository.js.map