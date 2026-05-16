"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmakingService = exports.MatchmakingService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
const user_repository_1 = require("../repositories/user.repository");
const match_repository_1 = require("../repositories/match.repository");
const queue_repository_1 = require("../repositories/queue.repository");
const env_1 = require("../config/env");
const log = (0, logger_1.createLogger)('matchmaking-service');
const QUEUE_KEYS = {
    FREE: 'queue:free',
    VIP: 'queue:vip',
    VIP_FILTERED: (key) => `queue:vip:filtered:${key}`,
};
const USER_STATE_KEY = (userId) => `user:state:${userId}`;
const MATCH_KEY = (matchId) => `match:${matchId}`;
const COOLDOWN_KEY = (userId) => `cooldown:${userId}`;
class MatchmakingService {
    redis = (0, redis_1.getRedis)();
    env = (0, env_1.getEnv)();
    async addToQueue(userId, preferences) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        const queueType = user.isVip ? 'VIP' : 'FREE';
        const existingEntry = await queue_repository_1.queueRepository.findInQueue(userId);
        if (existingEntry) {
            log.warn({ userId }, 'User already in queue');
            return;
        }
        await queue_repository_1.queueRepository.addToQueue({
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
    async removeFromQueue(userId) {
        await queue_repository_1.queueRepository.removeFromQueue(userId);
        await this.redis.hset(USER_STATE_KEY(userId), {
            state: 'IDLE',
        });
        log.info({ userId }, 'User removed from queue');
    }
    async findMatch(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new Error('User not found');
        const queueType = user.isVip ? 'VIP' : 'FREE';
        const candidates = await queue_repository_1.queueRepository.getOldestInQueue(queueType, 20);
        const filteredCandidates = candidates.filter(c => c.userId !== userId);
        if (filteredCandidates.length === 0) {
            return null;
        }
        const selectedCandidate = filteredCandidates[Math.floor(Math.random() * filteredCandidates.length)];
        if (!selectedCandidate) {
            return null;
        }
        const match = await match_repository_1.matchRepository.create(userId, selectedCandidate.userId);
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
    async setMatchSession(matchId, userAId, userBId) {
        await this.redis.hset(MATCH_KEY(matchId), {
            userAId,
            userBId,
            startedAt: Date.now().toString(),
        });
        await this.redis.expire(MATCH_KEY(matchId), 3600);
    }
    async setCooldown(userId) {
        const cooldown = userId.startsWith('vip_') || userId.includes('vip')
            ? this.env.VIP_MATCH_COOLDOWN_SECONDS
            : this.env.FREE_MATCH_COOLDOWN_SECONDS;
        if (cooldown > 0) {
            await this.redis.set(COOLDOWN_KEY(userId), '1', 'EX', cooldown);
        }
    }
    async isOnCooldown(userId) {
        const result = await this.redis.get(COOLDOWN_KEY(userId));
        return result === '1';
    }
    async getUserState(userId) {
        const state = await this.redis.hgetall(USER_STATE_KEY(userId));
        return {
            state: state.state || 'IDLE',
            matchId: state.matchId,
            partnerId: state.partnerId,
            searchStarted: state.searchStarted ? parseInt(state.searchStarted) : undefined,
        };
    }
    async clearMatch(userId) {
        const state = await this.getUserState(userId);
        if (state.matchId) {
            const match = await match_repository_1.matchRepository.findById(state.matchId);
            if (match && !match.endedAt) {
                const partnerId = match.userAId === userId ? match.userBId : match.userAId;
                await match_repository_1.matchRepository.endMatch(state.matchId, 'DISCONNECTED');
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
    async getQueueStats() {
        const [free, vip] = await Promise.all([
            queue_repository_1.queueRepository.getQueueCount('FREE'),
            queue_repository_1.queueRepository.getQueueCount('VIP'),
        ]);
        return { free, vip };
    }
    async cleanupStaleQueue(minutes = 10) {
        const staleEntries = await queue_repository_1.queueRepository.getStaleEntries(minutes);
        for (const entry of staleEntries) {
            await this.removeFromQueue(entry.userId);
            log.info({ userId: entry.userId }, 'Removed stale queue entry');
        }
        return staleEntries.length;
    }
    async cleanupStaleMatches(minutes = 30) {
        const staleMatches = await match_repository_1.matchRepository.getStaleMatches(minutes);
        for (const match of staleMatches) {
            await match_repository_1.matchRepository.endMatch(match.id, 'TIMEOUT');
            await this.redis.hset(USER_STATE_KEY(match.userAId), { state: 'IDLE' });
            await this.redis.hset(USER_STATE_KEY(match.userBId), { state: 'IDLE' });
            await this.redis.del(MATCH_KEY(match.id));
            log.info({ matchId: match.id }, 'Closed stale match');
        }
        return staleMatches.length;
    }
}
exports.MatchmakingService = MatchmakingService;
exports.matchmakingService = new MatchmakingService();
//# sourceMappingURL=matchmaking.service.js.map