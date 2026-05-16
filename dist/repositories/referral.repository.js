"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralRepository = exports.ReferralRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const log = (0, logger_1.createLogger)('referral-repository');
class ReferralRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async create(data) {
        return this.prisma.referral.create({
            data: {
                referrerId: data.referrerId,
                referredUserId: data.referredUserId,
                status: 'PENDING',
            },
        });
    }
    async markQualified(referralId) {
        await this.prisma.referral.update({
            where: { id: referralId },
            data: { status: 'QUALIFIED' },
        });
    }
    async markRewarded(referralId) {
        await this.prisma.referral.update({
            where: { id: referralId },
            data: {
                status: 'REWARDED',
                rewardedAt: new Date(),
            },
        });
    }
    async markRejected(referralId) {
        await this.prisma.referral.update({
            where: { id: referralId },
            data: { status: 'REJECTED' },
        });
    }
    async findByReferredUser(referredUserId) {
        return this.prisma.referral.findUnique({
            where: { referredUserId },
            include: { referrer: true },
        });
    }
    async getReferrerStats(referrerId) {
        const [total, pending, qualified, rewarded] = await Promise.all([
            this.prisma.referral.count({ where: { referrerId } }),
            this.prisma.referral.count({ where: { referrerId, status: 'PENDING' } }),
            this.prisma.referral.count({ where: { referrerId, status: 'QUALIFIED' } }),
            this.prisma.referral.count({ where: { referrerId, status: 'REWARDED' } }),
        ]);
        return { total, pending, qualified, rewarded };
    }
    async getPendingReferrals() {
        return this.prisma.referral.findMany({
            where: { status: 'PENDING' },
            include: { referredUser: true },
        });
    }
}
exports.ReferralRepository = ReferralRepository;
exports.referralRepository = new ReferralRepository();
//# sourceMappingURL=referral.repository.js.map