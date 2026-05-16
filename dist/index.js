"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserMapping = registerUserMapping;
require("dotenv/config");
const grammy_1 = require("grammy");
const runner_1 = require("@grammyjs/runner");
const prisma_1 = require("./config/prisma");
const redis_1 = require("./config/redis");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const commands = __importStar(require("./bot/commands"));
const callbacks = __importStar(require("./bot/callbacks"));
const handlers = __importStar(require("./bot/handlers"));
const middlewares = __importStar(require("./bot/middlewares"));
const jobs_1 = require("./jobs");
const queue_service_1 = require("./services/queue.service");
const redis_2 = require("./config/redis");
const log = (0, logger_1.createLogger)('main');
let runner = null;
let schedulers = [];
async function createBot() {
    const env = (0, env_1.getEnv)();
    const bot = new grammy_1.Bot(env.BOT_TOKEN);
    bot.use(middlewares.logMiddleware);
    bot.use(middlewares.banCheckMiddleware);
    bot.use(middlewares.userSetupMiddleware);
    bot.command('start', commands.startCommand);
    bot.command('help', commands.helpCommand);
    bot.command('stats', commands.statsCommand);
    bot.command('users', commands.usersCommand);
    bot.command('reports', commands.reportsCommand);
    bot.command('broadcast', commands.broadcastCommand);
    bot.on('callback_query:data', callbacks.handleCallback);
    bot.on('message', handlers.handleMessage);
    bot.on('my_chat_member', handlers.handleMyChatMember);
    bot.catch((err) => {
        const ctx = err.ctx;
        log.error({ err: err.error, userId: ctx.from?.id }, 'Unhandled error');
        ctx.reply('❌ An error occurred. Please try again.').catch(() => {
            log.error({ err: err.error }, 'Failed to send error message');
        });
    });
    return bot;
}
async function registerUserMapping(userId, telegramId) {
    const redis = (0, redis_2.getRedis)();
    const key = `user:telegram:${userId}`;
    await redis.set(key, telegramId.toString(), 'EX', 86400);
}
async function startBot() {
    log.info('Starting bot...');
    const env = (0, env_1.getEnv)();
    await (0, prisma_1.connectPrisma)();
    await (0, redis_1.connectRedis)();
    const bot = await createBot();
    await bot.api.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Get help' },
    ]);
    const runnerResult = (0, runner_1.run)(bot);
    runner = runnerResult;
    log.info('Bot started and polling');
    if (env.NODE_ENV === 'production') {
        log.info('Starting background schedulers...');
        schedulers.push((0, jobs_1.createVipExpiryScheduler)(1));
        schedulers.push((0, jobs_1.createCleanupScheduler)(15));
        schedulers.push((0, jobs_1.createReferralScheduler)(60));
        log.info('Background schedulers started');
    }
    log.info('Bot is ready!');
}
async function stopBot() {
    log.info('Stopping bot...');
    for (const scheduler of schedulers) {
        clearInterval(scheduler);
    }
    schedulers = [];
    if (runner) {
        await runner.stop();
        runner = null;
    }
    await queue_service_1.queueService.closeAll();
    await (0, redis_1.disconnectRedis)();
    await (0, prisma_1.disconnectPrisma)();
    log.info('Bot stopped');
}
async function main() {
    process.on('SIGINT', async () => {
        log.info('Received SIGINT, shutting down...');
        await stopBot();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        log.info('Received SIGTERM, shutting down...');
        await stopBot();
        process.exit(0);
    });
    process.on('unhandledRejection', (reason) => {
        log.error({ reason }, 'Unhandled rejection');
    });
    process.on('uncaughtException', (error) => {
        log.error({ err: error }, 'Uncaught exception');
        process.exit(1);
    });
    await startBot();
}
main().catch((error) => {
    logger_1.logger.error({ err: error }, 'Fatal error');
    process.exit(1);
});
//# sourceMappingURL=index.js.map