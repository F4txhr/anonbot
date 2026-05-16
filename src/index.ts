import 'dotenv/config';
import { Bot } from 'grammy';
import { run } from '@grammyjs/runner';
import { connectPrisma, disconnectPrisma } from './config/prisma';
import { connectRedis, disconnectRedis } from './config/redis';
import { getEnv } from './config/env';
import { logger, createLogger } from './config/logger';
import * as commands from './bot/commands';
import * as callbacks from './bot/callbacks';
import * as handlers from './bot/handlers';
import * as middlewares from './bot/middlewares';
import {
  createVipExpiryScheduler,
  createCleanupScheduler,
  createReferralScheduler,
} from './jobs';
import { queueService } from './services/queue.service';
import { getRedis } from './config/redis';
import { userRepository } from './repositories/user.repository';

const log = createLogger('main');

let runner: { stop: () => Promise<void> } | null = null;
let schedulers: NodeJS.Timeout[] = [];

async function createBot(): Promise<Bot> {
  const env = getEnv();

  const bot = new Bot(env.BOT_TOKEN);

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

async function registerUserMapping(userId: string, telegramId: number): Promise<void> {
  const redis = getRedis();
  const key = `user:telegram:${userId}`;
  await redis.set(key, telegramId.toString(), 'EX', 86400);
}

async function startBot(): Promise<void> {
  log.info('Starting bot...');

  const env = getEnv();

  await connectPrisma();
  await connectRedis();

  const bot = await createBot();

  await bot.api.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help' },
  ]);

  const runnerResult = run(bot);
  runner = runnerResult;

  log.info('Bot started and polling');

  if (env.NODE_ENV === 'production') {
    log.info('Starting background schedulers...');

    schedulers.push(createVipExpiryScheduler(1));
    schedulers.push(createCleanupScheduler(15));
    schedulers.push(createReferralScheduler(60));

    log.info('Background schedulers started');
  }

  log.info('Bot is ready!');
}

async function stopBot(): Promise<void> {
  log.info('Stopping bot...');

  for (const scheduler of schedulers) {
    clearInterval(scheduler);
  }
  schedulers = [];

  if (runner) {
    await runner.stop();
    runner = null;
  }

  await queueService.closeAll();
  await disconnectRedis();
  await disconnectPrisma();

  log.info('Bot stopped');
}

async function main(): Promise<void> {
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
  logger.error({ err: error }, 'Fatal error');
  process.exit(1);
});

export { registerUserMapping };