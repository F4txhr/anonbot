"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationService = exports.ModerationService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
const user_repository_1 = require("../repositories/user.repository");
const report_repository_1 = require("../repositories/report.repository");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('moderation-service');
const RATE_LIMIT_KEY = (userId) => `ratelimit:${userId}`;
const TRUST_SCORE_DECREMENT = {
    REPORT: -10,
    SKIP: -2,
    SPAM: -15,
    ABUSE: -20,
};
class ModerationService {
    redis = (0, redis_1.getRedis)();
    env = (0, env_1.getEnv)();
    async checkRateLimit(userId) {
        const key = RATE_LIMIT_KEY(userId);
        const current = await this.redis.incr(key);
        if (current === 1) {
            await this.redis.expire(key, this.env.MESSAGE_RATE_WINDOW_SECONDS);
        }
        if (current > this.env.MESSAGE_RATE_LIMIT) {
            log.warn({ userId, count: current }, 'Rate limit exceeded');
            return false;
        }
        return true;
    }
    async handleReport(reporterId, targetId, reason) {
        await report_repository_1.reportRepository.create({
            reporterId,
            targetId,
            reason: reason,
        });
        await user_repository_1.userRepository.updateTrustScore(targetId, TRUST_SCORE_DECREMENT.REPORT);
        const reportCount = await report_repository_1.reportRepository.countReportsAgainstUser(targetId);
        if (reportCount >= 5) {
            await this.applyAutoBan(targetId, 'TEMPORARY', 'Too many reports');
        }
        log.info({ targetId, reason, reportCount }, 'Report processed');
    }
    async handleSkip(userId) {
        await user_repository_1.userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.SKIP);
    }
    async handleSpam(userId) {
        await user_repository_1.userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.SPAM);
        const user = await user_repository_1.userRepository.findById(userId);
        if (user && user.trustScore < 30) {
            await this.applyAutoBan(userId, 'TEMPORARY', 'Spam detected');
        }
        log.info({ userId, trustScore: user?.trustScore }, 'Spam warning');
    }
    async handleAbuse(userId, reason) {
        await user_repository_1.userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.ABUSE);
        await this.applyAutoBan(userId, 'PERMANENT', reason);
        log.info({ userId, reason }, 'Abuse case handled');
    }
    async applyAutoBan(userId, type, reason) {
        const expiresAt = type === 'TEMPORARY'
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null;
        await user_repository_1.userRepository.ban(userId, type, reason, expiresAt ?? undefined);
        log.info({ userId, type, reason }, 'Auto ban applied');
    }
    async getTrustScore(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        return user?.trustScore ?? this.env.INITIAL_TRUST_SCORE;
    }
    async isUserBanned(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            return false;
        if (user.isBanned) {
            if (user.banExpiresAt && user.banExpiresAt < new Date()) {
                await user_repository_1.userRepository.unban(userId);
                return false;
            }
            return true;
        }
        return false;
    }
    async checkMessageSafety(message) {
        const spamKeywords = ['http', 'www', '.com', '.net', 'bit.ly', 't.me/', 'join'];
        const lowerMessage = message.toLowerCase();
        const spamCount = spamKeywords.filter(kw => lowerMessage.includes(kw)).length;
        if (spamCount >= 3) {
            return { isSafe: false, flagged: true, reason: 'Potential spam detected' };
        }
        if (message.length > 2000) {
            return { isSafe: false, flagged: true, reason: 'Message too long' };
        }
        return { isSafe: true, flagged: false };
    }
    async performShadowMatch(userId) {
        const trustScore = await this.getTrustScore(userId);
        return trustScore < 50;
    }
    async getModerationStats() {
        const totalReports = await report_repository_1.reportRepository.count();
        const avgTrustScore = 75;
        return {
            totalReports,
            bannedUsers: 0,
            avgTrustScore,
        };
    }
}
exports.ModerationService = ModerationService;
exports.moderationService = new ModerationService();
//# sourceMappingURL=moderation.service.js.map