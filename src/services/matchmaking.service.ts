import { QueueType, Prisma } from '@prisma/client';
import { getRedis } from '../config/redis';
import { createLogger } from '../config/logger';
import { userRepository } from '../repositories/user.repository';
import { matchRepository } from '../repositories/match.repository';
import { queueRepository } from '../repositories/queue.repository';
import { getEnv } from '../config/env';

const log = createLogger('matchmaking-service');

const QUEUE_KEYS = {
  FREE: 'queue:free',
  VIP: 'queue:vip',
  VIP_FILTERED: (key: string) => `queue:vip:filtered:${key}`,
};

const USER_STATE_KEY = (userId: string) => `user:state:${userId}`;
const MATCH_KEY = (matchId: string) => `match:${matchId}`;
const COOLDOWN_KEY = (userId: string) => `cooldown:${userId}`;

export class MatchmakingService {
  private redis = getRedis();
  private env = getEnv();

  async addToQueue(userId: string, preferences?: {
    gender?: string;
    ageRange?: string;
    country?: string;
    interests?: string[];
  }): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const queueType: QueueType = user.isVip ? 'VIP' : 'FREE';

    const existingEntry = await queueRepository.findInQueue(userId);
    if (existingEntry) {
      log.warn({ userId }, 'User already in queue');
      return;
    }

    await queueRepository.addToQueue({
      userId,
      queueType,
      preferences: preferences ?? {},
    });

    await this.redis.hset(USER_STATE_KEY(userId), {
      state: 'SEARCHING',
      searchStarted: Date.now().toString(),
    });

    log.info({ userId, queueType }, 'User added to queue');
  }

  async removeFromQueue(userId: string): Promise<void> {
    await queueRepository.removeFromQueue(userId);
    await this.redis.hset(USER_STATE_KEY(userId), {
      state: 'IDLE',
    });
    log.info({ userId }, 'User removed from queue');
  }

  async findMatch(userId: string): Promise<{ matchId: string; partnerId: string } | null> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const queueType: QueueType = user.isVip ? 'VIP' : 'FREE';

    const candidates = await queueRepository.getOldestInQueue(queueType, 20);
    const filteredCandidates = candidates.filter(c => c.userId !== userId);

    if (filteredCandidates.length === 0) {
      return null;
    }

    const selectedCandidate = filteredCandidates[Math.floor(Math.random() * filteredCandidates.length)];
    if (!selectedCandidate) {
      return null;
    }

    const match = await matchRepository.create(userId, selectedCandidate.userId);

    await this.removeFromQueue(userId);
    await this.removeFromQueue(selectedCandidate.userId);

    await this.redis.hset(USER_STATE_KEY(userId), {
      state: 'CHATTING',
      matchId: match.id,
      partnerId: selectedCandidate.userId,
    });

    await this.redis.hset(USER_STATE_KEY(selectedCandidate.userId), {
      state: 'CHATTING',
      matchId: match.id,
      partnerId: userId,
    });

    await this.setMatchSession(match.id, userId, selectedCandidate.userId);

    await this.setCooldown(userId);
    await this.setCooldown(selectedCandidate.userId);

    log.info({ matchId: match.id, userA: userId, userB: selectedCandidate.userId }, 'Match created');

    return {
      matchId: match.id,
      partnerId: selectedCandidate.userId,
    };
  }

  private async setMatchSession(matchId: string, userAId: string, userBId: string): Promise<void> {
    await this.redis.hset(MATCH_KEY(matchId), {
      userAId,
      userBId,
      startedAt: Date.now().toString(),
    });
    await this.redis.expire(MATCH_KEY(matchId), 3600);
  }

  private async setCooldown(userId: string): Promise<void> {
    const cooldown = userId.startsWith('vip_') || userId.includes('vip')
      ? this.env.VIP_MATCH_COOLDOWN_SECONDS
      : this.env.FREE_MATCH_COOLDOWN_SECONDS;

    if (cooldown > 0) {
      await this.redis.set(COOLDOWN_KEY(userId), '1', 'EX', cooldown);
    }
  }

  async isOnCooldown(userId: string): Promise<boolean> {
    const result = await this.redis.get(COOLDOWN_KEY(userId));
    return result === '1';
  }

  async getUserState(userId: string): Promise<{
    state: string;
    matchId?: string;
    partnerId?: string;
    searchStarted?: number;
  }> {
    const state = await this.redis.hgetall(USER_STATE_KEY(userId));
    return {
      state: state.state || 'IDLE',
      matchId: state.matchId,
      partnerId: state.partnerId,
      searchStarted: state.searchStarted ? parseInt(state.searchStarted) : undefined,
    };
  }

  async clearMatch(userId: string): Promise<void> {
    const state = await this.getUserState(userId);

    if (state.matchId) {
      const match = await matchRepository.findById(state.matchId);
      if (match && !match.endedAt) {
        const partnerId = match.userAId === userId ? match.userBId : match.userAId;
        await matchRepository.endMatch(state.matchId, 'DISCONNECTED');

        await this.redis.hset(USER_STATE_KEY(partnerId), {
          state: 'IDLE',
        });
      }

      await this.redis.del(MATCH_KEY(state.matchId));
    }

    await this.redis.hset(USER_STATE_KEY(userId), {
      state: 'IDLE',
    });

    log.info({ userId }, 'Match cleared');
  }

  async getQueueStats(): Promise<{
    free: number;
    vip: number;
  }> {
    const [free, vip] = await Promise.all([
      queueRepository.getQueueCount('FREE'),
      queueRepository.getQueueCount('VIP'),
    ]);

    return { free, vip };
  }

  async cleanupStaleQueue(minutes = 10): Promise<number> {
    const staleEntries = await queueRepository.getStaleEntries(minutes);

    for (const entry of staleEntries) {
      await this.removeFromQueue(entry.userId);
      log.info({ userId: entry.userId }, 'Removed stale queue entry');
    }

    return staleEntries.length;
  }

  async cleanupStaleMatches(minutes = 30): Promise<number> {
    const staleMatches = await matchRepository.getStaleMatches(minutes);

    for (const match of staleMatches) {
      await matchRepository.endMatch(match.id, 'TIMEOUT');

      await this.redis.hset(USER_STATE_KEY(match.userAId), { state: 'IDLE' });
      await this.redis.hset(USER_STATE_KEY(match.userBId), { state: 'IDLE' });

      await this.redis.del(MATCH_KEY(match.id));

      log.info({ matchId: match.id }, 'Closed stale match');
    }

    return staleMatches.length;
  }
}

export const matchmakingService = new MatchmakingService();