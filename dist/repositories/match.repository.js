"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRepository = exports.MatchRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const log = (0, logger_1.createLogger)('match-repository');
class MatchRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async create(userAId, userBId) {
        return this.prisma.match.create({
            data: {
                userAId,
                userBId,
            },
        });
    }
    async findById(matchId) {
        return this.prisma.match.findUnique({
            where: { id: matchId },
        });
    }
    async findActiveMatch(userId) {
        return this.prisma.match.findFirst({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
                endedAt: null,
            },
        });
    }
    async findActiveMatchWithUsers(userId) {
        return this.prisma.match.findFirst({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
                endedAt: null,
            },
            include: { userA: true, userB: true },
        });
    }
    async endMatch(matchId, reason) {
        await this.prisma.match.update({
            where: { id: matchId },
            data: {
                endedAt: new Date(),
                endedReason: reason,
            },
        });
    }
    async getMatchPartner(matchId, userId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match)
            return null;
        if (match.userAId === userId)
            return match.userBId;
        if (match.userBId === userId)
            return match.userAId;
        return null;
    }
    async getMatchByUserId(userId) {
        return this.prisma.match.findFirst({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
                endedAt: null,
            },
            include: { userA: true, userB: true },
        });
    }
    async countMatches() {
        return this.prisma.match.count();
    }
    async countActiveMatches() {
        return this.prisma.match.count({
            where: { endedAt: null },
        });
    }
    async countUserMatches(userId) {
        const countA = await this.prisma.match.count({ where: { userAId: userId } });
        const countB = await this.prisma.match.count({ where: { userBId: userId } });
        return countA + countB;
    }
    async getStaleMatches(minutes) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.prisma.match.findMany({
            where: {
                endedAt: null,
                startedAt: { lt: cutoff },
            },
        });
    }
    async getUserMatchHistory(userId, limit = 10) {
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
exports.MatchRepository = MatchRepository;
exports.matchRepository = new MatchRepository();
//# sourceMappingURL=match.repository.js.map