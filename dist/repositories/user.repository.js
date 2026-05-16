"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const referral_1 = require("../utils/referral");
const log = (0, logger_1.createLogger)('user-repository');
class UserRepository {
    prisma;
    constructor() {
        this.prisma = prisma_1.prisma;
    }
    async findByTelegramId(telegramId) {
        return this.prisma.user.findUnique({
            where: { telegramId },
            include: { preferences: true },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { preferences: true },
        });
    }
    async create(data) {
        const referralCode = (0, referral_1.generateReferralCode)(data.telegramId.toString());
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
    async updateGender(userId, gender) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { gender },
        });
    }
    async updateAgeRange(userId, ageRange) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { ageRange },
        });
    }
    async updateInterests(userId, interests) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { interests },
        });
    }
    async updateCountry(userId, country) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { country },
        });
    }
    async updatePreferences(userId, preferences) {
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
    async updateTrustScore(userId, delta) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        const newScore = Math.max(0, Math.min(100, user.trustScore + delta));
        await this.prisma.user.update({
            where: { id: userId },
            data: { trustScore: newScore },
        });
    }
    async setVip(userId, expiresAt) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isVip: true,
                vipExpiresAt: expiresAt,
            },
        });
    }
    async removeVip(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isVip: false,
                vipExpiresAt: null,
            },
        });
    }
    async ban(userId, type, reason, expiresAt) {
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
    async unban(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: false, banExpiresAt: null },
        });
    }
    async delete(userId) {
        await this.prisma.user.delete({
            where: { id: userId },
        });
    }
    async getVipExpiringSoon(hours) {
        const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
        return this.prisma.user.findMany({
            where: {
                isVip: true,
                vipExpiresAt: { lte: deadline, gt: new Date() },
            },
        });
    }
    async getActiveUsersCount() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.prisma.user.count({
            where: { updatedAt: { gte: oneDayAgo } },
        });
    }
    async count() {
        return this.prisma.user.count();
    }
    async countVip() {
        return this.prisma.user.count({
            where: { isVip: true, vipExpiresAt: { gt: new Date() } },
        });
    }
    async findBannedUser(telegramId) {
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
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map