"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSetupMiddleware = userSetupMiddleware;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.banCheckMiddleware = banCheckMiddleware;
exports.errorHandlerMiddleware = errorHandlerMiddleware;
exports.logMiddleware = logMiddleware;
const user_repository_1 = require("../../repositories/user.repository");
const redis_1 = require("../../config/redis");
const logger_1 = require("../../config/logger");
const log = (0, logger_1.createLogger)('middlewares');
async function userSetupMiddleware(ctx, next) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        await next();
        return;
    }
    const user = await user_repository_1.userRepository.findByTelegramId(BigInt(telegramId));
    if (user) {
        const redis = (0, redis_1.getRedis)();
        const key = `user:telegram:${user.id}`;
        await redis.set(key, telegramId.toString(), 'EX', 86400);
    }
    await next();
}
async function rateLimitMiddleware(ctx, next) {
    await next();
}
async function banCheckMiddleware(ctx, next) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
        await next();
        return;
    }
    const bannedUser = await user_repository_1.userRepository.findBannedUser(BigInt(telegramId));
    if (bannedUser) {
        log.warn({ telegramId }, 'Banned user tried to access');
        return;
    }
    await next();
}
async function errorHandlerMiddleware(ctx, error) {
    log.error({ err: error, userId: ctx.from?.id }, 'Unhandled error');
    try {
        await ctx.reply('❌ An error occurred. Please try again.');
    }
    catch {
        log.error({ err: error }, 'Failed to send error message');
    }
}
async function logMiddleware(ctx, next) {
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
//# sourceMappingURL=index.js.map