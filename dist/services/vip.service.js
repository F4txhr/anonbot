"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vipService = exports.VipService = void 0;
const logger_1 = require("../config/logger");
const user_repository_1 = require("../repositories/user.repository");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('vip-service');
class VipService {
    env = (0, env_1.getEnv)();
    async isVip(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            return false;
        if (!user.isVip)
            return false;
        if (user.vipExpiresAt && user.vipExpiresAt < new Date()) {
            await user_repository_1.userRepository.removeVip(userId);
            log.info({ userId }, 'VIP expired');
            return false;
        }
        return true;
    }
    async updatePreferences(userId, preferences) {
        const isVipUser = await this.isVip(userId);
        if (!isVipUser) {
            throw new Error('VIP membership required');
        }
        await user_repository_1.userRepository.updatePreferences(userId, preferences);
        log.info({ userId, preferences }, 'VIP preferences updated');
    }
    async getPreferences(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            return null;
        return user.preferences ? {
            preferredGender: user.preferences.preferredGender,
            preferredAgeRange: user.preferences.preferredAgeRange,
            preferredCountry: user.preferences.preferredCountry,
            preferredInterests: user.preferences.preferredInterests,
        } : null;
    }
    async getVipStatus(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            return { isVip: false };
        }
        if (!user.isVip || !user.vipExpiresAt) {
            return { isVip: false };
        }
        if (user.vipExpiresAt < new Date()) {
            await user_repository_1.userRepository.removeVip(userId);
            return { isVip: false };
        }
        const daysRemaining = Math.ceil((user.vipExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
            isVip: true,
            expiresAt: user.vipExpiresAt,
            daysRemaining,
        };
    }
    async cleanupExpiredVip() {
        const expiredUsers = await user_repository_1.userRepository.getVipExpiringSoon(0);
        for (const user of expiredUsers) {
            if (user.vipExpiresAt && user.vipExpiresAt < new Date()) {
                await user_repository_1.userRepository.removeVip(user.id);
                log.info({ userId: user.id }, 'Expired VIP cleaned up');
            }
        }
        return expiredUsers.length;
    }
    getVipFeatures() {
        return [
            'Gender preference filter',
            'Age preference filter',
            'Interest matching',
            'Country preference filter',
            'Unlimited skips',
            'No cooldown',
            'Priority queue',
            'Advanced matching preferences',
        ];
    }
    async extendVip(userId, hours) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        let currentExpiry = user.vipExpiresAt || new Date();
        if (currentExpiry < new Date()) {
            currentExpiry = new Date();
        }
        const newExpiry = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);
        await user_repository_1.userRepository.setVip(userId, newExpiry);
        log.info({ userId, hours, newExpiry }, 'VIP extended');
        return newExpiry;
    }
}
exports.VipService = VipService;
exports.vipService = new VipService();
//# sourceMappingURL=vip.service.js.map