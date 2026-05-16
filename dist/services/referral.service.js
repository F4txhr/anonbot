"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
const logger_1 = require("../config/logger");
const referral_repository_1 = require("../repositories/referral.repository");
const user_repository_1 = require("../repositories/user.repository");
const match_repository_1 = require("../repositories/match.repository");
const vip_service_1 = require("./vip.service");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('referral-service');
class ReferralService {
    env = (0, env_1.getEnv)();
    async createReferral(referrerId, referredUserId) {
        const existing = await referral_repository_1.referralRepository.findByReferredUser(referredUserId);
        if (existing) {
            log.debug({ referredUserId }, 'Referral already exists');
            return;
        }
        await referral_repository_1.referralRepository.create({
            referrerId,
            referredUserId,
        });
        log.info({ referrerId, referredUserId }, 'Referral created');
    }
    async processQualifiedReferral(referralId) {
        const referral = await referral_repository_1.referralRepository.findByReferredUser(referralId);
        if (!referral)
            return false;
        if (referral.status !== 'PENDING') {
            log.debug({ referralId }, 'Referral already processed');
            return false;
        }
        await referral_repository_1.referralRepository.markQualified(referralId);
        const referrer = await user_repository_1.userRepository.findById(referral.referrerId);
        if (!referrer)
            return false;
        const hours = this.env.REFERRAL_VIP_HOURS;
        await vip_service_1.vipService.extendVip(referrer.id, hours * 24);
        await referral_repository_1.referralRepository.markRewarded(referral.id);
        log.info({ referralId, referrerId: referral.referrerId, hours }, 'Referral reward applied');
        return true;
    }
    async rejectReferral(referralId) {
        await referral_repository_1.referralRepository.markRejected(referralId);
        log.info({ referralId }, 'Referral rejected');
    }
    async verifyAndRewardReferrals() {
        const pendingReferrals = await referral_repository_1.referralRepository.getPendingReferrals();
        let rewarded = 0;
        for (const referral of pendingReferrals) {
            const matchedCount = await match_repository_1.matchRepository.countUserMatches(referral.referredUserId);
            if (matchedCount > 0) {
                await this.processQualifiedReferral(referral.id);
                rewarded++;
            }
            else {
                log.debug({ referralId: referral.id }, 'Referral not qualified yet');
            }
        }
        return rewarded;
    }
    async getReferrerStats(referrerId) {
        const stats = await referral_repository_1.referralRepository.getReferrerStats(referrerId);
        return {
            totalInvites: stats.total,
            pendingInvites: stats.pending,
            qualifiedInvites: stats.qualified,
            vipDaysEarned: stats.rewarded * this.env.REFERRAL_VIP_HOURS,
        };
    }
    getReferralLink(referrerId, botUsername) {
        const referralCode = `ref_${referrerId.substring(0, 12)}`;
        return `https://t.me/${botUsername}?start=${referralCode}`;
    }
}
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
//# sourceMappingURL=referral.service.js.map