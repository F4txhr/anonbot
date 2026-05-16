"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVipExpiryJob = processVipExpiryJob;
exports.processCleanupStaleQueueJob = processCleanupStaleQueueJob;
exports.processCleanupStaleMatchesJob = processCleanupStaleMatchesJob;
exports.processReferralVerificationJob = processReferralVerificationJob;
exports.processVipExpirationJob = processVipExpirationJob;
exports.createVipExpiryScheduler = createVipExpiryScheduler;
exports.createCleanupScheduler = createCleanupScheduler;
exports.createReferralScheduler = createReferralScheduler;
const logger_1 = require("../config/logger");
const vip_service_1 = require("../services/vip.service");
const matchmaking_service_1 = require("../services/matchmaking.service");
const referral_service_1 = require("../services/referral.service");
const user_repository_1 = require("../repositories/user.repository");
const log = (0, logger_1.createLogger)('jobs');
async function processVipExpiryJob(job) {
    log.info({ jobId: job.id, userId: job.data.userId }, 'Processing VIP expiry job');
    const isVip = await vip_service_1.vipService.isVip(job.data.userId);
    if (!isVip) {
        log.info({ userId: job.data.userId }, 'User VIP already expired');
        return;
    }
    const status = await vip_service_1.vipService.getVipStatus(job.data.userId);
    if (status.expiresAt && status.expiresAt <= new Date()) {
        await user_repository_1.userRepository.removeVip(job.data.userId);
        log.info({ userId: job.data.userId, expiresAt: status.expiresAt }, 'VIP expired and removed');
    }
}
async function processCleanupStaleQueueJob(job) {
    log.info({ jobId: job.id, minutes: job.data.minutes }, 'Processing stale queue cleanup');
    const cleaned = await matchmaking_service_1.matchmakingService.cleanupStaleQueue(job.data.minutes);
    log.info({ cleanedCount: cleaned }, 'Stale queue cleanup completed');
}
async function processCleanupStaleMatchesJob(job) {
    log.info({ jobId: job.id, minutes: job.data.minutes }, 'Processing stale matches cleanup');
    const cleaned = await matchmaking_service_1.matchmakingService.cleanupStaleMatches(job.data.minutes);
    log.info({ cleanedCount: cleaned }, 'Stale matches cleanup completed');
}
async function processReferralVerificationJob(job) {
    log.info({ jobId: job.id, referralId: job.data.referralId }, 'Processing referral verification');
    const rewarded = await referral_service_1.referralService.verifyAndRewardReferrals();
    log.info({ rewardedCount: rewarded }, 'Referral verification completed');
}
async function processVipExpirationJob(job) {
    log.info({ jobId: job.id }, 'Processing VIP expiration check');
    const cleaned = await vip_service_1.vipService.cleanupExpiredVip();
    log.info({ cleanedCount: cleaned }, 'VIP expiration check completed');
}
function createVipExpiryScheduler(intervalHours = 1) {
    return setInterval(async () => {
        try {
            await vip_service_1.vipService.cleanupExpiredVip();
        }
        catch (error) {
            log.error({ err: error }, 'VIP expiry scheduler error');
        }
    }, intervalHours * 60 * 60 * 1000);
}
function createCleanupScheduler(intervalMinutes = 15) {
    return setInterval(async () => {
        try {
            await matchmaking_service_1.matchmakingService.cleanupStaleQueue(10);
            await matchmaking_service_1.matchmakingService.cleanupStaleMatches(30);
        }
        catch (error) {
            log.error({ err: error }, 'Cleanup scheduler error');
        }
    }, intervalMinutes * 60 * 1000);
}
function createReferralScheduler(intervalMinutes = 60) {
    return setInterval(async () => {
        try {
            await referral_service_1.referralService.verifyAndRewardReferrals();
        }
        catch (error) {
            log.error({ err: error }, 'Referral scheduler error');
        }
    }, intervalMinutes * 60 * 1000);
}
//# sourceMappingURL=index.js.map