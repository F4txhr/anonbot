import { Gender, AgeRange } from '@prisma/client';
import { createLogger } from '../config/logger';
import { userRepository } from '../repositories/user.repository';
import { getEnv } from '../config/env';

const log = createLogger('vip-service');

export class VipService {
  private env = getEnv();

  async isVip(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;

    if (!user.isVip) return false;

    if (user.vipExpiresAt && user.vipExpiresAt < new Date()) {
      await userRepository.removeVip(userId);
      log.info({ userId }, 'VIP expired');
      return false;
    }

    return true;
  }

  async updatePreferences(userId: string, preferences: {
    preferredGender?: Gender | null;
    preferredAgeRange?: AgeRange | null;
    preferredCountry?: string | null;
    preferredInterests?: string[];
  }): Promise<void> {
    const isVipUser = await this.isVip(userId);
    if (!isVipUser) {
      throw new Error('VIP membership required');
    }

    await userRepository.updatePreferences(userId, preferences);
    log.info({ userId, preferences }, 'VIP preferences updated');
  }

  async getPreferences(userId: string): Promise<{
    preferredGender?: Gender | null;
    preferredAgeRange?: AgeRange | null;
    preferredCountry?: string | null;
    preferredInterests?: string[];
  } | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    return user.preferences ? {
      preferredGender: user.preferences.preferredGender,
      preferredAgeRange: user.preferences.preferredAgeRange,
      preferredCountry: user.preferences.preferredCountry,
      preferredInterests: user.preferences.preferredInterests,
    } : null;
  }

  async getVipStatus(userId: string): Promise<{
    isVip: boolean;
    expiresAt?: Date;
    daysRemaining?: number;
  }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return { isVip: false };
    }

    if (!user.isVip || !user.vipExpiresAt) {
      return { isVip: false };
    }

    if (user.vipExpiresAt < new Date()) {
      await userRepository.removeVip(userId);
      return { isVip: false };
    }

    const daysRemaining = Math.ceil(
      (user.vipExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      isVip: true,
      expiresAt: user.vipExpiresAt,
      daysRemaining,
    };
  }

  async cleanupExpiredVip(): Promise<number> {
    const expiredUsers = await userRepository.getVipExpiringSoon(0);

    for (const user of expiredUsers) {
      if (user.vipExpiresAt && user.vipExpiresAt < new Date()) {
        await userRepository.removeVip(user.id);
        log.info({ userId: user.id }, 'Expired VIP cleaned up');
      }
    }

    return expiredUsers.length;
  }

  getVipFeatures(): string[] {
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

  async extendVip(userId: string, hours: number): Promise<Date> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    let currentExpiry = user.vipExpiresAt || new Date();
    if (currentExpiry < new Date()) {
      currentExpiry = new Date();
    }

    const newExpiry = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);
    await userRepository.setVip(userId, newExpiry);

    log.info({ userId, hours, newExpiry }, 'VIP extended');
    return newExpiry;
  }
}

export const vipService = new VipService();