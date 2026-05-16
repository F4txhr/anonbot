import { Context, NextFunction } from 'grammy';
import { userRepository } from '../../repositories/user.repository';
import { getRedis } from '../../config/redis';
import { createLogger } from '../../config/logger';
import { matchmakingService } from '../../services/matchmaking.service';

const log = createLogger('middlewares');

export async function userSetupMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await next();
    return;
  }

  const user = await userRepository.findByTelegramId(BigInt(telegramId));

  if (user) {
    const redis = getRedis();
    const key = `user:telegram:${user.id}`;
    await redis.set(key, telegramId.toString(), 'EX', 86400);
  }

  await next();
}

export async function rateLimitMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  await next();
}

export async function banCheckMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await next();
    return;
  }

  const bannedUser = await userRepository.findBannedUser(BigInt(telegramId));
  if (bannedUser) {
    log.warn({ telegramId }, 'Banned user tried to access');
    return;
  }

  await next();
}

export async function errorHandlerMiddleware(ctx: Context, error: unknown): Promise<void> {
  log.error({ err: error, userId: ctx.from?.id }, 'Unhandled error');

  try {
    await ctx.reply('❌ An error occurred. Please try again.');
  } catch {
    log.error({ err: error }, 'Failed to send error message');
  }
}

export async function logMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const start = Date.now();

  log.debug({
    updateType: ctx.update.update_id,
    messageType: ctx.message ? 'message' : 'other',
    callbackQuery: ctx.callbackQuery?.data,
    userId: ctx.from?.id,
  }, 'Incoming update');

  await next();

  const duration = Date.now() - start;
  log.debug({ duration }, 'Update processed');
}