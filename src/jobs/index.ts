import { Job } from 'bullmq';
import { createLogger } from '../config/logger';
import { vipService } from '../services/vip.service';
import { matchmakingService } from '../services/matchmaking.service';
import { referralService } from '../services/referral.service';
import { userRepository } from '../repositories/user.repository';

const log = createLogger('jobs');

export async function processVipExpiryJob(job: Job<{ userId: string }>): Promise<void> {
  log.info({ jobId: job.id, userId: job.data.userId }, 'Processing VIP expiry job');

  const isVip = await vipService.isVip(job.data.userId);

  if (!isVip) {
    log.info({ userId: job.data.userId }, 'User VIP already expired');
    return;
  }

  const status = await vipService.getVipStatus(job.data.userId);

  if (status.expiresAt && status.expiresAt <= new Date()) {
    await userRepository.removeVip(job.data.userId);
    log.info({ userId: job.data.userId, expiresAt: status.expiresAt }, 'VIP expired and removed');
  }
}

export async function processCleanupStaleQueueJob(job: Job<{ minutes: number }>): Promise<void> {
  log.info({ jobId: job.id, minutes: job.data.minutes }, 'Processing stale queue cleanup');

  const cleaned = await matchmakingService.cleanupStaleQueue(job.data.minutes);

  log.info({ cleanedCount: cleaned }, 'Stale queue cleanup completed');
}

export async function processCleanupStaleMatchesJob(job: Job<{ minutes: number }>): Promise<void> {
  log.info({ jobId: job.id, minutes: job.data.minutes }, 'Processing stale matches cleanup');

  const cleaned = await matchmakingService.cleanupStaleMatches(job.data.minutes);

  log.info({ cleanedCount: cleaned }, 'Stale matches cleanup completed');
}

export async function processReferralVerificationJob(job: Job<{ referralId: string }>): Promise<void> {
  log.info({ jobId: job.id, referralId: job.data.referralId }, 'Processing referral verification');

  const rewarded = await referralService.verifyAndRewardReferrals();

  log.info({ rewardedCount: rewarded }, 'Referral verification completed');
}

export async function processVipExpirationJob(job: Job<unknown>): Promise<void> {
  log.info({ jobId: job.id }, 'Processing VIP expiration check');

  const cleaned = await vipService.cleanupExpiredVip();

  log.info({ cleanedCount: cleaned }, 'VIP expiration check completed');
}

export function createVipExpiryScheduler(intervalHours = 1): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await vipService.cleanupExpiredVip();
    } catch (error) {
      log.error({ err: error }, 'VIP expiry scheduler error');
    }
  }, intervalHours * 60 * 60 * 1000);
}

export function createCleanupScheduler(intervalMinutes = 15): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await matchmakingService.cleanupStaleQueue(10);
      await matchmakingService.cleanupStaleMatches(30);
    } catch (error) {
      log.error({ err: error }, 'Cleanup scheduler error');
    }
  }, intervalMinutes * 60 * 1000);
}

export function createReferralScheduler(intervalMinutes = 60): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await referralService.verifyAndRewardReferrals();
    } catch (error) {
      log.error({ err: error }, 'Referral scheduler error');
    }
  }, intervalMinutes * 60 * 1000);
}