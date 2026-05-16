import { getRedis } from '../config/redis';
import { createLogger } from '../config/logger';
import { userRepository } from '../repositories/user.repository';
import { reportRepository } from '../repositories/report.repository';
import { getEnv } from '../config/env';

const log = createLogger('moderation-service');

const RATE_LIMIT_KEY = (userId: string) => `ratelimit:${userId}`;
const TRUST_SCORE_DECREMENT = {
  REPORT: -10,
  SKIP: -2,
  SPAM: -15,
  ABUSE: -20,
};

export class ModerationService {
  private redis = getRedis();
  private env = getEnv();

  async checkRateLimit(userId: string): Promise<boolean> {
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

  async handleReport(reporterId: string, targetId: string, reason: string): Promise<void> {
    await reportRepository.create({
      reporterId,
      targetId,
      reason: reason as 'SPAM' | 'HARASSMENT' | 'NSFW' | 'SCAM' | 'FAKE_BEHAVIOR' | 'OTHER',
    });

    await userRepository.updateTrustScore(targetId, TRUST_SCORE_DECREMENT.REPORT);

    const reportCount = await reportRepository.countReportsAgainstUser(targetId);

    if (reportCount >= 5) {
      await this.applyAutoBan(targetId, 'TEMPORARY', 'Too many reports');
    }

    log.info({ targetId, reason, reportCount }, 'Report processed');
  }

  async handleSkip(userId: string): Promise<void> {
    await userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.SKIP);
  }

  async handleSpam(userId: string): Promise<void> {
    await userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.SPAM);

    const user = await userRepository.findById(userId);
    if (user && user.trustScore < 30) {
      await this.applyAutoBan(userId, 'TEMPORARY', 'Spam detected');
    }

    log.info({ userId, trustScore: user?.trustScore }, 'Spam warning');
  }

  async handleAbuse(userId: string, reason: string): Promise<void> {
    await userRepository.updateTrustScore(userId, TRUST_SCORE_DECREMENT.ABUSE);

    await this.applyAutoBan(userId, 'PERMANENT' as const, reason);

    log.info({ userId, reason }, 'Abuse case handled');
  }

  private async applyAutoBan(userId: string, type: 'TEMPORARY' | 'PERMANENT', reason: string): Promise<void> {
    const expiresAt = type === 'TEMPORARY'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    await userRepository.ban(userId, type, reason, expiresAt ?? undefined);

    log.info({ userId, type, reason }, 'Auto ban applied');
  }

  async getTrustScore(userId: string): Promise<number> {
    const user = await userRepository.findById(userId);
    return user?.trustScore ?? this.env.INITIAL_TRUST_SCORE;
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;

    if (user.isBanned) {
      if (user.banExpiresAt && user.banExpiresAt < new Date()) {
        await userRepository.unban(userId);
        return false;
      }
      return true;
    }

    return false;
  }

  async checkMessageSafety(message: string): Promise<{
    isSafe: boolean;
    flagged: boolean;
    reason?: string;
  }> {
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

  async performShadowMatch(userId: string): Promise<boolean> {
    const trustScore = await this.getTrustScore(userId);
    return trustScore < 50;
  }

  async getModerationStats(): Promise<{
    totalReports: number;
    bannedUsers: number;
    avgTrustScore: number;
  }> {
    const totalReports = await reportRepository.count();
    const avgTrustScore = 75;

    return {
      totalReports,
      bannedUsers: 0,
      avgTrustScore,
    };
  }
}

export const moderationService = new ModerationService();