import { createLogger } from '../config/logger';
import { referralRepository } from '../repositories/referral.repository';
import { userRepository } from '../repositories/user.repository';
import { matchRepository } from '../repositories/match.repository';
import { vipService } from './vip.service';
import { getEnv } from '../config/env';

const log = createLogger('referral-service');

export class ReferralService {
  private env = getEnv();

  async createReferral(referrerId: string, referredUserId: string): Promise<void> {
    const existing = await referralRepository.findByReferredUser(referredUserId);
    if (existing) {
      log.debug({ referredUserId }, 'Referral already exists');
      return;
    }

    await referralRepository.create({
      referrerId,
      referredUserId,
    });

    log.info({ referrerId, referredUserId }, 'Referral created');
  }

  async processQualifiedReferral(referralId: string): Promise<boolean> {
    const referral = await referralRepository.findByReferredUser(referralId);
    if (!referral) return false;

    if (referral.status !== 'PENDING') {
      log.debug({ referralId }, 'Referral already processed');
      return false;
    }

    await referralRepository.markQualified(referralId);

    const referrer = await userRepository.findById(referral.referrerId);
    if (!referrer) return false;

    const hours = this.env.REFERRAL_VIP_HOURS;
    await vipService.extendVip(referrer.id, hours * 24);

    await referralRepository.markRewarded(referral.id);

    log.info({ referralId, referrerId: referral.referrerId, hours }, 'Referral reward applied');
    return true;
  }

  async rejectReferral(referralId: string): Promise<void> {
    await referralRepository.markRejected(referralId);
    log.info({ referralId }, 'Referral rejected');
  }

  async verifyAndRewardReferrals(): Promise<number> {
    const pendingReferrals = await referralRepository.getPendingReferrals();
    let rewarded = 0;

    for (const referral of pendingReferrals) {
      const matchedCount = await matchRepository.countUserMatches(referral.referredUserId);

      if (matchedCount > 0) {
        await this.processQualifiedReferral(referral.id);
        rewarded++;
      } else {
        log.debug({ referralId: referral.id }, 'Referral not qualified yet');
      }
    }

    return rewarded;
  }

  async getReferrerStats(referrerId: string): Promise<{
    totalInvites: number;
    pendingInvites: number;
    qualifiedInvites: number;
    vipDaysEarned: number;
  }> {
    const stats = await referralRepository.getReferrerStats(referrerId);

    return {
      totalInvites: stats.total,
      pendingInvites: stats.pending,
      qualifiedInvites: stats.qualified,
      vipDaysEarned: stats.rewarded * this.env.REFERRAL_VIP_HOURS,
    };
  }

  getReferralLink(referrerId: string, botUsername: string): string {
    const referralCode = `ref_${referrerId.substring(0, 12)}`;
    return `https://t.me/${botUsername}?start=${referralCode}`;
  }
}

export const referralService = new ReferralService();